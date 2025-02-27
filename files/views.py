from django.http import HttpResponse, HttpResponseNotFound
from core.settings import BASE_DIR
from django.contrib.auth.decorators import login_required
import os
from .models import File
from django.http import JsonResponse
import mimetypes

# Create your views here.

@login_required(login_url="accounts/login")
def serve_file(request, file_uuid):
    if not File.objects.filter(file_uuid=file_uuid).exists():
        return HttpResponseNotFound()
    
    # Also check if user avatar is requested file 
    # or room of message with this file is in user rooms
    # if not return not found

    user = request.user
    file = File.objects.get(file_uuid=file_uuid)
    # if file.file_uuid != user.avatar_img.file_uuid:
    #     return HttpResponseNotFound()
    
    file_path = file.file.url

    # profile_img = request.user.profile_img
    # print(profile_img)
    # if not profile_img:
    #     return HttpResponseNotFound()
    
    path_to_image = os.path.normpath("".join((str(BASE_DIR), file_path)))
    content_type, encoding = mimetypes.guess_type(path_to_image)

    image_data = open(path_to_image, "rb").read()
    return HttpResponse(image_data, content_type=content_type)

@login_required
def upload_file(request):
    if request.method == 'POST':
        print(request.POST)
        print(request.FILES)
        file = request.FILES.get("attached_file")
        print(file)
        file_instance = File.objects.create(file = file)
        file_instance.save()
        file_uuid = file_instance.file_uuid
        return JsonResponse({'file_uuid': file_uuid})