from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from django.utils import timezone

# Import Models
from campus_core.models import School, AcademicYear, AcademicTerm, ClassLevel, Section, Subject, GradingSystem, SyllabusTopic
from campus_students.models import Student, Enrollment, AcademicRecord, Attendance
from campus_finance.models import FeeCategory, FeeStructure, StudentAccount, PaymentReceipt
from campus_assets.models import Asset
from campus_users.models import User

# Import Serializers
from campus_core.serializers import (
    SchoolSerializer, AcademicYearSerializer, AcademicTermSerializer,
    ClassLevelSerializer, SectionSerializer, SubjectSerializer, GradingSystemSerializer, SyllabusTopicSerializer
)
from campus_students.serializers import (
    StudentSerializer, EnrollmentSerializer, AcademicRecordSerializer, AttendanceSerializer
)
from campus_finance.serializers import (
    FeeCategorySerializer, FeeStructureSerializer,
    StudentAccountSerializer, PaymentReceiptSerializer
)
from campus_assets.serializers import AssetSerializer
from campus_users.serializers import UserSerializer

TABLE_MODEL_MAP = {
    'users': User,
    'schools': School,
    'academic_years': AcademicYear,
    'academic_terms': AcademicTerm,
    'class_levels': ClassLevel,
    'sections': Section,
    'subjects': Subject,
    'grading_systems': GradingSystem,
    'syllabus_topics': SyllabusTopic,
    'students': Student,
    'enrollments': Enrollment,
    'academic_records': AcademicRecord,
    'attendance': Attendance,
    'fee_categories': FeeCategory,
    'fee_structures': FeeStructure,
    'student_accounts': StudentAccount,
    'payment_receipts': PaymentReceipt,
    'assets': Asset,
}

SERIALIZER_MAP = {
    'users': UserSerializer,
    'schools': SchoolSerializer,
    'academic_years': AcademicYearSerializer,
    'academic_terms': AcademicTermSerializer,
    'class_levels': ClassLevelSerializer,
    'sections': SectionSerializer,
    'subjects': SubjectSerializer,
    'grading_systems': GradingSystemSerializer,
    'syllabus_topics': SyllabusTopicSerializer,
    'students': StudentSerializer,
    'enrollments': EnrollmentSerializer,
    'academic_records': AcademicRecordSerializer,
    'attendance': AttendanceSerializer,
    'fee_categories': FeeCategorySerializer,
    'fee_structures': FeeStructureSerializer,
    'student_accounts': StudentAccountSerializer,
    'payment_receipts': PaymentReceiptSerializer,
    'assets': AssetSerializer,
}

class SyncPushView(APIView):
    def post(self, request, *args, **kwargs):
        mutations = request.data.get('mutations', [])
        results = []
        
        for mut in mutations:
            table = mut.get('table')
            action = mut.get('action')
            record_id = mut.get('record_id')
            data = mut.get('data', {})
            
            model = TABLE_MODEL_MAP.get(table)
            if not model:
                results.append({
                    'record_id': record_id,
                    'status': 'error',
                    'message': f'Unknown table: {table}'
                })
                continue
            
            try:
                with transaction.atomic():
                    client_updated_at_str = data.get('updated_at')
                    client_updated_at = parse_datetime(client_updated_at_str) if client_updated_at_str else None
                    
                    if action in ['CREATE', 'UPDATE']:
                        # Map foreign keys by appending _id and clean payload
                        cleaned_data = {}
                        for field, value in data.items():
                            if field == 'id':
                                cleaned_data['id'] = value
                                continue
                            
                            model_field = None
                            try:
                                model_field = model._meta.get_field(field)
                            except:
                                pass
                            
                            if model_field:
                                if model_field.is_relation and not model_field.many_to_many:
                                    # Use foreign key ID suffix
                                    cleaned_data[f"{field}_id"] = value
                                else:
                                    cleaned_data[field] = value
                        
                        obj = model.objects.filter(id=record_id).first()
                        if obj:
                            # Conflict check: Server LWW
                            if client_updated_at and obj.updated_at > client_updated_at:
                                results.append({
                                    'record_id': record_id,
                                    'status': 'skipped',
                                    'message': 'Server record is newer than client modification'
                                })
                                continue
                            
                            # Update fields
                            for key, val in cleaned_data.items():
                                if key != 'id':
                                    setattr(obj, key, val)
                            obj.save()
                        else:
                            # Create new record
                            obj = model(**cleaned_data)
                            obj.save()
                            
                        results.append({
                            'record_id': record_id,
                            'status': 'applied',
                            'updated_at': obj.updated_at
                        })
                        
                    elif action == 'DELETE':
                        obj = model.objects.filter(id=record_id).first()
                        if obj:
                            obj.is_deleted = True
                            obj.save()
                            results.append({
                                'record_id': record_id,
                                'status': 'applied',
                                'updated_at': obj.updated_at
                            })
                        else:
                            results.append({
                                'record_id': record_id,
                                'status': 'skipped',
                                'message': 'Record not found for deletion'
                            })
            except Exception as e:
                results.append({
                    'record_id': record_id,
                    'status': 'error',
                    'message': str(e)
                })
                    
        return Response({'status': 'success', 'results': results})

class SyncPullView(APIView):
    def get(self, request, *args, **kwargs):
        last_sync_str = request.query_params.get('last_sync')
        last_sync = parse_datetime(last_sync_str) if last_sync_str else None
        
        server_timestamp = timezone.now()
        changes = {}
        
        for table, model in TABLE_MODEL_MAP.items():
            if last_sync:
                queryset = model.objects.filter(updated_at__gt=last_sync)
            else:
                # First-time sync pull down all active (non-soft-deleted) records
                queryset = model.objects.filter(is_deleted=False)
                
            serializer_class = SERIALIZER_MAP.get(table)
            if serializer_class:
                serializer = serializer_class(queryset, many=True)
                changes[table] = serializer.data
            else:
                changes[table] = []
                
        return Response({
            'server_timestamp': server_timestamp,
            'changes': changes
        })

