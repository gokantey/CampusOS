from django.db import models
import uuid

class SyncModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True

class School(SyncModel):
    name = models.CharField(max_length=150)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return self.name

class AcademicYear(SyncModel):
    display_name = models.CharField(max_length=20)  # e.g. "2025/2026"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.display_name

class AcademicTerm(SyncModel):
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50)  # e.g. "Term 1"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.academic_year} - {self.name}"

class ClassLevel(SyncModel):
    name = models.CharField(max_length=50)  # e.g. "Class 1", "JHS 1"
    order_index = models.IntegerField(default=0)  # for sorting levels

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['order_index']

class Section(SyncModel):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=10)  # e.g. "A", "B"

    def __str__(self):
        return f"{self.class_level.name} {self.name}"

class Subject(SyncModel):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name

class GradingSystem(SyncModel):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, null=True, blank=True, related_name='grading_systems')
    sba_weight = models.DecimalField(max_digits=4, decimal_places=2, default=40.00)  # e.g. 40.00%
    exam_weight = models.DecimalField(max_digits=4, decimal_places=2, default=60.00)  # e.g. 60.00%

    def __str__(self):
        level_str = self.class_level.name if self.class_level else "Default"
        return f"Grading Weight for {level_str}: SBA {self.sba_weight}% / Exam {self.exam_weight}%"

class SyllabusTopic(SyncModel):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='syllabus_topics')
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    order_index = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.subject.name} - {self.title}"


