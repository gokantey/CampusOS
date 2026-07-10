from rest_framework import viewsets
from .models import Student, Enrollment, AcademicRecord, Attendance
from .serializers import StudentSerializer, EnrollmentSerializer, AcademicRecordSerializer, AttendanceSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.filter(is_deleted=False)
    serializer_class = StudentSerializer
    search_fields = ['first_name', 'last_name', 'admission_number']

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.filter(is_deleted=False)
    serializer_class = EnrollmentSerializer
    filterset_fields = ['student', 'academic_year', 'class_level', 'section']

class AcademicRecordViewSet(viewsets.ModelViewSet):
    queryset = AcademicRecord.objects.filter(is_deleted=False)
    serializer_class = AcademicRecordSerializer
    filterset_fields = ['student', 'term', 'subject']

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.filter(is_deleted=False)
    serializer_class = AttendanceSerializer
    filterset_fields = ['student', 'date', 'status']


