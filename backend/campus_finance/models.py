from django.db import models
from campus_core.models import SyncModel, AcademicTerm, ClassLevel
from campus_students.models import Student, Enrollment

class FeeCategory(SyncModel):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class FeeStructure(SyncModel):
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='fee_structures')
    term = models.ForeignKey(AcademicTerm, on_delete=models.CASCADE, related_name='fee_structures')
    category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE, related_name='fee_structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.class_level.name} - {self.term.name} - {self.category.name}: {self.amount}"

class StudentAccount(SyncModel):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='account')
    total_billed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Account for {self.student.first_name} {self.student.last_name} (Bal: {self.balance})"

    def recalculate_ledger(self):
        # 1. Calculate Total Billed
        # Find all terms that the student was enrolled in.
        # An enrollment links student to AcademicYear.
        # Find all AcademicTerms in those AcademicYears.
        # Find all FeeStructures for those terms and the enrollment's class level.
        total_billed = 0
        enrollments = Enrollment.objects.filter(student=self.student)
        for enrollment in enrollments:
            # Get terms in the enrollment academic year
            terms = AcademicTerm.objects.filter(academic_year=enrollment.academic_year)
            # Find fee structures matching the class level and terms
            fees = FeeStructure.objects.filter(
                class_level=enrollment.class_level,
                term__in=terms
            )
            for fee in fees:
                total_billed += fee.amount
        
        # 2. Calculate Total Paid
        total_paid = 0
        receipts = PaymentReceipt.objects.filter(student=self.student)
        for receipt in receipts:
            total_paid += receipt.amount_paid
            
        self.total_billed = total_billed
        self.total_paid = total_paid
        self.balance = total_billed - total_paid
        self.save()

class PaymentReceipt(SyncModel):
    PAYMENT_MODES = (
        ('Cash', 'Cash'),
        ('Mobile Money', 'Mobile Money'),
        ('Bank Draft', 'Bank Draft'),
        ('Other', 'Other'),
    )
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='receipts')
    receipt_number = models.CharField(max_length=50, unique=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance_remaining = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_date = models.DateField()
    payment_mode = models.CharField(max_length=30, choices=PAYMENT_MODES, default='Cash')
    recorded_by = models.ForeignKey('campus_users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_payments')

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.student.last_name}: {self.amount_paid}"

    def save(self, *args, **kwargs):
        # Recalculate ledger for this student first to get fresh billed/paid totals
        account, created = StudentAccount.objects.get_or_create(student=self.student)
        
        # Sum up other payments excluding this one (in case of updates)
        other_receipts = PaymentReceipt.objects.filter(student=self.student).exclude(id=self.id)
        other_paid = sum(r.amount_paid for r in other_receipts)
        
        # Re-calc billed
        total_billed = 0
        enrollments = Enrollment.objects.filter(student=self.student)
        for enrollment in enrollments:
            terms = AcademicTerm.objects.filter(academic_year=enrollment.academic_year)
            fees = FeeStructure.objects.filter(class_level=enrollment.class_level, term__in=terms)
            for fee in fees:
                total_billed += fee.amount
                
        # Remaining balance is current total billed - other paid - this amount
        self.balance_remaining = total_billed - (other_paid + self.amount_paid)
        
        super().save(*args, **kwargs)
        
        # Trigger standard recalculation for actual persistent account values
        account.recalculate_ledger()

