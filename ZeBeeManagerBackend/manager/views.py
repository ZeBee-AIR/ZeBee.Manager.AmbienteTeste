from rest_framework import viewsets
from .models import Squad, RevenueHistory, SquadPerformance, Client
from .serializers import SquadSerializer, RevenueHistorySerializer, SquadPerformanceSerializer, ClientSerializer

# Usamos ReadOnlyModelViewSet para criar endpoints que apenas leem dados (GET)
# Assegure que os nomes das ViewSets correspondem ao que o router espera.
class SquadViewSet(viewsets.ModelViewSet):
    """API endpoint para visualizar dados dos squads."""
    queryset = Squad.objects.all()
    serializer_class = SquadSerializer

class RevenueHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint para visualizar o histórico de receitas."""
    queryset = RevenueHistory.objects.all().order_by('month')
    serializer_class = RevenueHistorySerializer

class SquadPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint para visualizar o desempenho mensal dos squads."""
    queryset = SquadPerformance.objects.all().order_by('month')
    serializer_class = SquadPerformanceSerializer

class ClientViewSet(viewsets.ModelViewSet):
    """
    Endpoint da API que permite que clientes sejam visualizados ou editados.
    """
    queryset = Client.objects.all().order_by('store_name')
    serializer_class = ClientSerializer

