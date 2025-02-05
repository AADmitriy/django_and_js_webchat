from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import *
from .forms import MessageCreateForm
from django.http import JsonResponse
from core.settings import MessageType
from rest_framework.response import Response
from .models import ChatRoom

from accounts.models import User
from accounts.serializers import UserSerializer

from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from accounts.serializers import UserSerializer
from .serializers import MessageSerializer

# Create your views here.
@login_required(login_url="accounts/login")
def chat_page(request):
    user = request.user
    msg_form = MessageCreateForm(request.POST or None)

    enum_str = ''
    for type in (MessageType):
        enum_str += f"const {type.name} = {type.value};\n"

    context = {'msg_form': msg_form, 'message_types': enum_str}
    return render(request, "chat_page.html", context)

@login_required()
def proto(request):
    return render(request, "prototype.html")

@login_required
def create_group(request):
    if request.method == 'POST':
        # get name
        group_name = request.POST.get("group_name")
        if len(group_name) < 1:
            return JsonResponse({'success': False})
        # get file
        print(request.POST)
        group_avatar = request.FILES.get('group_avatar')
        
        group_avatar_instance = None
        avatar_uuid = None
        if group_avatar:
            group_avatar_instance = File.objects.create(file = group_avatar)
            group_avatar_instance.save()
            avatar_uuid = group_avatar_instance.file_uuid
        
        group_instance = ChatRoom.objects.create(
            group_name=group_name,
            is_private=False,
            admin=request.user,
            room_avatar=group_avatar_instance,
        )
        group_instance.members.add(request.user)
        # group_instance.save()

        server_response = {
            "success": True,
            "msg_type": MessageType.GROUP_CREATED.value,
            "group_name": group_name,
            "avatar_uuid": avatar_uuid,
            "room_uuid": group_instance.room_uuid
        }

        return JsonResponse(server_response)
    else:
        return JsonResponse({'success': False})
    
def get_room_data(user, chat_room):
    room_data = {}
    room_data['is_private'] = chat_room.is_private

    if not chat_room.is_private:
        #set group attributes
        group_data = {}
        group_data['avatar_uuid'] = None
        if chat_room.room_avatar:
            group_data['avatar_uuid'] = str(chat_room.room_avatar.file_uuid)
        
        group_data["room_name"] = chat_room.group_name
        group_data["admin_id"] = None
        if chat_room.admin:
            group_data["admin_id"] = chat_room.admin.id
        room_data['group_data'] = group_data
        
    
    # get collocutors data dict
    collocutors = [ m for m in chat_room.members.all() if m != user ]
    room_data['collocutors'] = {}
    for collocutor in collocutors:
        room_data['collocutors'][collocutor.id] = UserSerializer(
            collocutor,
            many=False
        ).data
    
    # get messages array
    textings = chat_room.chat_messages.all()
    room_data['messages'] = MessageSerializer(textings, many=True).data

    # change collocutor msgs reading records to boolean value
    for msg in room_data['messages']:
        if msg['author'] != user.id:
            user_readed_collocutor_msg = user.id in msg['read_records']
            msg.pop('read_records')
            msg['readed_by_user'] = user_readed_collocutor_msg
    
    return room_data


@api_view(('GET',))
@renderer_classes((JSONRenderer, ))
@login_required
def get_chats_and_groups(request, chat_name):
    if not chat_name:
        return Response({'error': 'Invalid parameters'})
    
    self_rooms = [ room.room_uuid for room in request.user.chat_rooms.all() ]
    groups = ChatRoom.objects.filter(group_name__contains=chat_name).exclude(room_uuid__in=self_rooms)

    self_contacts = [request.user.id]
    for room in request.user.chat_rooms.filter(is_private=True):
        members = room.members.all()
        user_a, user_b = members[0], members[1]
        if user_a.id == request.user.id:
            self_contacts.append(user_b.id)
        else:
            self_contacts.append(user_a.id)

    new_contacts = User.objects.filter(username__contains=chat_name).exclude(id__in=self_contacts)

    groups_serialiser = { group.room_uuid: get_room_data(request.user, group) for group in groups }
    users_serialiser = { user.id: UserSerializer(user, many=False).data for user in new_contacts }
    response = {
        'groups': groups_serialiser,
        'users': users_serialiser
    }

    return Response(response)
