from django.db import models
import uuid

# Create your models here.

class File(models.Model):
    file_uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to='files/')

    def __str__(self):
        return f'{self.file.url}    {self.file_uuid}' 