from rest_framework import viewsets
from .models import Asset
from .serializers import AssetSerializer

class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.filter(is_deleted=False)
    serializer_class = AssetSerializer
    search_fields = ['name', 'category', 'serial_number']
    filterset_fields = ['category', 'condition']

