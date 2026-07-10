from rest_framework import serializers
from .models import FeeCategory, FeeStructure, StudentAccount, PaymentReceipt

class FeeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeCategory
        fields = '__all__'

class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = '__all__'

class StudentAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAccount
        fields = '__all__'

class PaymentReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReceipt
        fields = '__all__'
