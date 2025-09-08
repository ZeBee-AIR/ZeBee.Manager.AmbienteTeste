from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Squad, RevenueHistory, SquadPerformance, Client, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['squad']

class UserSerializer(serializers.ModelSerializer):
    squad_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'is_superuser', 'squad_name']

    def get_squad_name(self, obj):
        if hasattr(obj, 'userprofile') and obj.userprofile.squad:
            return obj.userprofile.squad.name
        return "Super"

class SquadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Squad
        fields = ['id', 'name', 'active_clients']

class RevenueHistorySerializer(serializers.ModelSerializer):
    month = serializers.DateField(format="%b")
    class Meta:
        model = RevenueHistory
        fields = ['id', 'month', 'revenue', 'commission', 'new_clients', 'churns']

class SquadPerformanceSerializer(serializers.ModelSerializer):
    squad = serializers.StringRelatedField()
    month = serializers.DateField(format="%b")
    class Meta:
        model = SquadPerformance
        fields = ['id', 'squad', 'month', 'revenue']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id',
            'squad',
            'seller_name',
            'store_name',
            'seller_id',
            'seller_email',
            'phone_number',
            'contracted_plan',
            'plan_value',
            'client_commission_percentage',
            'has_special_commission',
            'special_commission_threshold',
            'monthly_data',
            'status',
            'created_at',
            'status_changed_at'
        ]

    def update(self, instance, validated_data):
        monthly_data_from_request = validated_data.pop('monthly_data', None)
        instance = super().update(instance, validated_data)

        if monthly_data_from_request is not None:
            instance.monthly_data = monthly_data_from_request
            instance.save()

        return instance
