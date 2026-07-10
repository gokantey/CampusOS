from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'quantity', 'location', 'condition', 'date_acquired')
    search_fields = ('name', 'category', 'serial_number')
    list_filter = ('category', 'condition', 'location')

