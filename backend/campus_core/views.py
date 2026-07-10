from rest_framework import viewsets
from .models import School, AcademicYear, AcademicTerm, ClassLevel, Section, Subject, GradingSystem, SyllabusTopic
from .serializers import (
    SchoolSerializer, AcademicYearSerializer, AcademicTermSerializer,
    ClassLevelSerializer, SectionSerializer, SubjectSerializer, GradingSystemSerializer, SyllabusTopicSerializer
)

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.filter(is_deleted=False)
    serializer_class = SchoolSerializer

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.filter(is_deleted=False)
    serializer_class = AcademicYearSerializer

class AcademicTermViewSet(viewsets.ModelViewSet):
    queryset = AcademicTerm.objects.filter(is_deleted=False)
    serializer_class = AcademicTermSerializer
    filterset_fields = ['academic_year']

class ClassLevelViewSet(viewsets.ModelViewSet):
    queryset = ClassLevel.objects.filter(is_deleted=False)
    serializer_class = ClassLevelSerializer

class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.filter(is_deleted=False)
    serializer_class = SectionSerializer
    filterset_fields = ['class_level']

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.filter(is_deleted=False)
    serializer_class = SubjectSerializer

class GradingSystemViewSet(viewsets.ModelViewSet):
    queryset = GradingSystem.objects.filter(is_deleted=False)
    serializer_class = GradingSystemSerializer
    filterset_fields = ['class_level']

class SyllabusTopicViewSet(viewsets.ModelViewSet):
    queryset = SyllabusTopic.objects.filter(is_deleted=False)
    serializer_class = SyllabusTopicSerializer
    filterset_fields = ['subject']


