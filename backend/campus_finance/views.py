from rest_framework import viewsets
from .models import FeeCategory, FeeStructure, StudentAccount, PaymentReceipt
from .serializers import (
    FeeCategorySerializer, FeeStructureSerializer,
    StudentAccountSerializer, PaymentReceiptSerializer
)

class FeeCategoryViewSet(viewsets.ModelViewSet):
    queryset = FeeCategory.objects.filter(is_deleted=False)
    serializer_class = FeeCategorySerializer

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.filter(is_deleted=False)
    serializer_class = FeeStructureSerializer
    filterset_fields = ['class_level', 'term']

class StudentAccountViewSet(viewsets.ModelViewSet):
    queryset = StudentAccount.objects.filter(is_deleted=False)
    serializer_class = StudentAccountSerializer
    filterset_fields = ['student']

class PaymentReceiptViewSet(viewsets.ModelViewSet):
    queryset = PaymentReceipt.objects.filter(is_deleted=False)
    serializer_class = PaymentReceiptSerializer
    filterset_fields = ['student']

