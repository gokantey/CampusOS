from django.contrib import admin
from .models import FeeCategory, FeeStructure, StudentAccount, PaymentReceipt

@admin.register(FeeCategory)
class FeeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')

@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ('class_level', 'term', 'category', 'amount')
    list_filter = ('class_level', 'term', 'category')

@admin.register(StudentAccount)
class StudentAccountAdmin(admin.ModelAdmin):
    list_display = ('student', 'total_billed', 'total_paid', 'balance')
    search_fields = ('student__first_name', 'student__last_name', 'student__admission_number')

@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'student', 'amount_paid', 'balance_remaining', 'payment_date', 'payment_mode')
    search_fields = ('receipt_number', 'student__first_name', 'student__last_name')
    list_filter = ('payment_date', 'payment_mode')

