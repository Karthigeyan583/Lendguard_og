from django.db import models
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace


class Person(models.Model):
    RELATIONSHIP_CHOICES = [
        ('friend', 'Friend'),
        ('family', 'Family'),
        ('colleague', 'Colleague'),
        ('business', 'Business Partner / Client'),
        ('other', 'Other'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='people', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_people')
    name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    relationship = models.CharField(max_length=30, choices=RELATIONSHIP_CHOICES, default='friend')
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags for filtering")
    notes = models.TextField(blank=True, help_text="Private notes")
    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_relationship_display()})"
