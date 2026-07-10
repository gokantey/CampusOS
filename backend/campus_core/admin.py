from django.contrib import admin
from .models import School, AcademicYear, AcademicTerm, ClassLevel, Section, Subject, GradingSystem

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'created_at')

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'start_date', 'end_date', 'is_current')

@admin.register(AcademicTerm)
class AcademicTermAdmin(admin.ModelAdmin):
    list_display = ('name', 'academic_year', 'start_date', 'end_date', 'is_current')

@admin.register(ClassLevel)
class ClassLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'order_index')

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'class_level')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')

@admin.register(GradingSystem)
class GradingSystemAdmin(admin.ModelAdmin):
    list_display = ('class_level', 'sba_weight', 'exam_weight')

