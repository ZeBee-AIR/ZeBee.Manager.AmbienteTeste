from rest_framework import serializers
from .models import Squad, RevenueHistory, SquadPerformance, Client

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
            'contracted_plan',
            'plan_value',
            'client_commission_percentage',
            'monthly_data',
            'status',
            'created_at',
            'status_changed_at'
        ]
