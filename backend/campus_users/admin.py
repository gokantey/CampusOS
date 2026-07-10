from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'full_name', 'role', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Campus Fields', {'fields': ('role', 'full_name')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Campus Fields', {'fields': ('role', 'full_name')}),
    )

admin.site.register(User, CustomUserAdmin)

