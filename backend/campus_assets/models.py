from django.db import models
from campus_core.models import SyncModel

class Asset(SyncModel):
    CONDITION_CHOICES = (
        ('Good', 'Good'),
        ('Needs Repair', 'Needs Repair'),
        ('Damaged', 'Damaged'),
    )
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)  # custom school-defined category
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=1)
    location = models.CharField(max_length=150, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    condition = models.CharField(max_length=30, choices=CONDITION_CHOICES, default='Good')
    date_acquired = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} (Qty: {self.quantity}) - {self.condition}"

