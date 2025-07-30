from django.db import models
from django.utils import timezone

class Squad(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome do Squad")
    active_clients = models.IntegerField(default=0, verbose_name="Clientes Ativos")
    def __str__(self):
        return self.name

class RevenueHistory(models.Model):
    month = models.DateField(verbose_name="Mês")
    revenue = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Receita")
    commission = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Comissão")
    new_clients = models.IntegerField(verbose_name="Novos Clientes")
    churns = models.IntegerField(verbose_name="Cancelamentos (Churn)")
    class Meta:
        ordering = ['month']
    def __str__(self):
        return self.month.strftime('%Y-%m')

class SquadPerformance(models.Model):
    squad = models.ForeignKey(Squad, on_delete=models.CASCADE, related_name='performance', verbose_name="Squad")
    month = models.DateField(verbose_name="Mês")
    revenue = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Receita do Squad")
    class Meta:
        ordering = ['month', 'squad']
        unique_together = ('squad', 'month')
    def __str__(self):
        return f"{self.squad.name} - {self.month.strftime('%Y-%m')}"

class Client(models.Model):
    squad = models.ForeignKey(
        Squad, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='clients', verbose_name="Squad Responsável"
    )
    seller_name = models.CharField(max_length=200, verbose_name="Nome do Cliente")
    store_name = models.CharField(max_length=200, verbose_name="Nome da Loja")
    seller_id = models.CharField(max_length=50, verbose_name="ID do Cliente", blank=True, null=True)
    seller_email = models.EmailField(verbose_name="Email do Cliente", blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('Ativo', 'Ativo'), ('Inativo', 'Inativo')], default='Ativo')
    contracted_plan = models.CharField(max_length=100, verbose_name="Plano Contratado")
    plan_value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor do Plano")
    client_commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Percentual de Comissão")
    monthly_data = models.JSONField(default=dict, verbose_name="Dados de Performance Mensal")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Data de Criação")
    status_changed_at = models.DateTimeField(null=True, blank=True, verbose_name="Data da Rescisão do Contrato")

    __original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status

    def save(self, *args, **kwargs):
        if self.status == 'Inativo' and self.__original_status == 'Ativo' and not self.status_changed_at:
            self.status_changed_at = timezone.now()
        elif self.status == 'Ativo' and self.__original_status == 'Inativo':
            self.status_changed_at = None

        super().save(*args, **kwargs)
        self.__original_status = self.status

    def __str__(self):
        return self.store_name