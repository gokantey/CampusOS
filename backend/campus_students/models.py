from django.db import models
from campus_core.models import SyncModel, AcademicYear, ClassLevel, Section

class Student(SyncModel):
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    )
    admission_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    guardian_name = models.CharField(max_length=150)
    guardian_contact = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.admission_number})"

class Enrollment(SyncModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='enrollments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='enrollments')

    def __str__(self):
        return f"{self.student} - {self.class_level} {self.section} ({self.academic_year})"

class AcademicRecord(SyncModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_records')
    term = models.ForeignKey('campus_core.AcademicTerm', on_delete=models.CASCADE, related_name='academic_records')
    subject = models.ForeignKey('campus_core.Subject', on_delete=models.CASCADE, related_name='academic_records')
    sba_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    exam_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grade_letter = models.CharField(max_length=10, blank=True)
    remarks = models.TextField(blank=True)
    recorded_by = models.ForeignKey('campus_users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_grades')

    def __str__(self):
        return f"{self.student.first_name} - {self.subject.name} ({self.term.name}): {self.final_score} ({self.grade_letter})"

    def save(self, *args, **kwargs):
        # We can calculate final score based on grading system weights
        # Fetch the active grading system for this class level
        # First find the active enrollment of the student in the term's academic year
        enrollment = Enrollment.objects.filter(
            student=self.student,
            academic_year=self.term.academic_year
        ).first()
        
        sba_weight = 40.0
        exam_weight = 60.0
        
        if enrollment:
            # check if class level has specific grading system
            from campus_core.models import GradingSystem
            gs = GradingSystem.objects.filter(class_level=enrollment.class_level).first()
            if gs:
                sba_weight = float(gs.sba_weight)
                exam_weight = float(gs.exam_weight)
        
        # Calculate weighted final score out of 100
        # Assuming raw scores are entered out of 100
        weighted_sba = float(self.sba_score) * (sba_weight / 100.0)
        weighted_exam = float(self.exam_score) * (exam_weight / 100.0)
        self.final_score = weighted_sba + weighted_exam
        
        # Simple letter grading mapping (Ghana WAEC scale or generic)
        score = self.final_score
        if score >= 80:
            self.grade_letter = 'A1'
        elif score >= 70:
            self.grade_letter = 'B2'
        elif score >= 65:
            self.grade_letter = 'B3'
        elif score >= 60:
            self.grade_letter = 'C4'
        elif score >= 55:
            self.grade_letter = 'C5'
        elif score >= 50:
            self.grade_letter = 'C6'
        elif score >= 45:
            self.grade_letter = 'D7'
        elif score >= 40:
            self.grade_letter = 'E8'
        else:
            self.grade_letter = 'F9'
            
        super().save(*args, **kwargs)

class Attendance(SyncModel):
    STATUS_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.student} - {self.date}: {self.status}"



