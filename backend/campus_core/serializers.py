from rest_framework import serializers
from .models import School, AcademicYear, AcademicTerm, ClassLevel, Section, Subject, GradingSystem, SyllabusTopic

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = '__all__'

class ClassLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassLevel
        fields = '__all__'

class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class GradingSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingSystem
        fields = '__all__'

class SyllabusTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusTopic
        fields = '__all__'

