from django.forms import ModelForm
from django import forms
from .models import Message

class MessageCreateForm(ModelForm):
    class Meta:
        model = Message
        fields = ['text', 'chat_room']
        widgets = {
            'text': forms.TextInput(
                attrs={'placeholder': 'Message', 
                       'class': 'message_input', 
                       'maxlength': '500', 
                       'autofocus': True}),
            'chat_room': forms.TextInput(attrs={'style': 'display:none;'}),
        }
