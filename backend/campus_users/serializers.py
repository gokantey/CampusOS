from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'updated_at', 'is_deleted', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
