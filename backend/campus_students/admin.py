from django.contrib import admin
from .models import Student, Enrollment, AcademicRecord

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('admission_number', 'first_name', 'last_name', 'gender', 'created_at')
    search_fields = ('admission_number', 'first_name', 'last_name')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'class_level', 'section', 'academic_year')
    list_filter = ('academic_year', 'class_level', 'section')

@admin.register(AcademicRecord)
class AcademicRecordAdmin(admin.ModelAdmin):
    list_display = ('student', 'term', 'subject', 'sba_score', 'exam_score', 'final_score', 'grade_letter')
    list_filter = ('term', 'subject')


