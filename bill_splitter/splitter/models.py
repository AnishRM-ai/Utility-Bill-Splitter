from django.db import models
from django.contrib.auth.models import User

class Bill(models.Model):
    title = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    paid_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="paid_bills")
    
class Split(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name="splits")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="debts")
    amount_owed = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    
