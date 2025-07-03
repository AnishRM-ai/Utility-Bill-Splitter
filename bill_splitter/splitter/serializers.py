from rest_framework import serializers
from .models import Bill, Split
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user 

class BillSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Bill
        fields = ['id', 'title', 'amount', 'date', 'paid_by']

class SplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Split
        fields = ['id', 'bill', 'user', 'amount_owed', 'is_paid']