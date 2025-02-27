import { MessagesContainer } from "./messages_flow.js"
import { ChatsList } from "./chats_list.js"
import { Input } from './input.js'
import { ChatRoomTopNav } from './chat_room_topnav.js'
import { ChatRoomInfo } from './chat_room_info.js'

var messagesContainer = null
var chatsList = null
var input = null
var chatRoomTopnav = null
var chatRoomInfo = null

var current_room_ref = {'current_room': null}
var current_room = null
var roomsData = null
var myData = null
var myId = null

// =================================================================================
// =================================================================================
//                                  Websocket functions
// =================================================================================
// =================================================================================
class Connection {
    constructor() {
        this.first = true
        this.socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat`);
        this.socket.onopen = (event) =>  this.#onopen(event)
        this.socket.onmessage = (event) =>  this.#onmessage(event)
        this.socket.onclose = (event) => this.#onclose(event)
    }
    #onopen(event) {
        console.log('You are Connected to WebSocket Server');
    }
    #onmessage(event) {
        if (this.first) {
            this.first = false
            initialize_chat(event.data)
            return
        }
        
        const server_response = JSON.parse(event.data);
        console.log('Received server_response:', server_response);
    
        if (server_response['msg_type'] == MESSAGE) {
            handle_new_message(server_response)
        }
        else if (server_response['msg_type'] == UPDATED_MESSAGE) { 
            messagesContainer.update_message(
                server_response['room_uuid'],
                server_response['id'],
                server_response['message']
            )
            chatsList.reload_room_last_msg_preview(server_response['room_uuid'])
        }
        else if (server_response['msg_type'] == DELETE_MESSAGE) { 
            messagesContainer.delete_message(
                server_response['room_uuid'],
                server_response['id']
            )
            chatsList.reload_room_last_msg_preview(server_response['room_uuid'])
        }
        else if (server_response['msg_type'] == ADD_REACTION) {
            messagesContainer.add_reaction_to_message(
                current_room_ref.current_room, server_response
            )
        }
        else if (server_response['msg_type'] == REMOVE_REACTION) {
            messagesContainer.remove_reaction_from_message(
                current_room_ref.current_room, server_response
            )
        }
        else if (server_response['msg_type'] == MARK_MESSAGE_AS_READ) {
            handle_mark_message_as_read(server_response)
        }
        else if (server_response['msg_type'] == USER_JOINED_ONLINE) {
            handle_user_joined_online(server_response)
        }
        else if (server_response['msg_type'] == USER_WENT_OFFLINE) {
            handle_user_went_offline(server_response)
        }
        else if (server_response['msg_type'] == ADD_USER_TO_GROUP) {
            handle_member_added_to_group(server_response)
        }
        else if (server_response['msg_type'] == REMOVE_USER_FROM_GROUP) {
            handle_member_removed_from_group(server_response)
        }
        else if (server_response['msg_type'] == JOIN_GROUP) {
            handle_join_group(server_response)
        }
        else if (server_response['msg_type'] == CREATE_PRIVATE_ROOM) {
            handle_create_private_room(server_response)
        }
    }
    #onclose(event) {
        console.log('Disconnected from WebSocket server');
    }
    
    send_message(room_uuid, message_text, attached_img_uuid=null, attached_file_uuid=null) {
        var request_data = {
            'room_uuid': room_uuid,
            'message': message_text,
            'attached_img_uuid': attached_img_uuid,
            'attached_file_uuid': attached_file_uuid,
            'request_type': MESSAGE,
        }

        this.socket.send(JSON.stringify(request_data));
    }
    
    send_update_message_request(room_uuid, message_text, msg_id) {
        var request_data = {
            'room_uuid': `${room_uuid}`,
            'message': `${message_text}`,
            'msg_id': Number(msg_id),
            'request_type': UPDATED_MESSAGE,
        }

        this.socket.send(JSON.stringify(request_data));
    }
    send_delete_message_request(room_uuid, msg_id) {
        var request_data = {
            'room_uuid': `${room_uuid}`,
            'msg_id': Number(msg_id),
            'request_type': DELETE_MESSAGE,
        }

        this.socket.send(JSON.stringify(request_data));
    }
    add_reaction_to_message_request(room_uuid, msg_id, emoji_unicode) {
        var request_data = {
            'room_uuid': `${room_uuid}`,
            'msg_id': Number(msg_id),
            'emoji_unicode': Number(emoji_unicode),
            'request_type': ADD_REACTION,
        }
        console.log(request_data)
        this.socket.send(JSON.stringify(request_data));
    }
    remove_reaction_from_message_request(room_uuid, msg_id) {
        var request_data = {
            'room_uuid': `${room_uuid}`,
            'msg_id': Number(msg_id),
            'request_type': REMOVE_REACTION,
        }

        this.socket.send(JSON.stringify(request_data));
    }
    send_mark_message_as_read_request(msg_id) {
        var request_data = {
            'msg_id': Number(msg_id),
            'request_type': MARK_MESSAGE_AS_READ,
        }

        this.socket.send(JSON.stringify(request_data));
    }
    send_add_member_to_group_request(member_id, room_uuid) {
        // console.log("calling callback with ", member_id, room_uuid)
        var request_data = {
            'member_id': Number(member_id),
            'room_uuid': room_uuid,
            'request_type': ADD_USER_TO_GROUP,
        }
        this.socket.send(JSON.stringify(request_data));
    }
    send_remove_member_from_group_request(member_id, room_uuid) {
        var request_data = {
            'member_id': Number(member_id),
            'room_uuid': room_uuid,
            'request_type': REMOVE_USER_FROM_GROUP,
        }
        this.socket.send(JSON.stringify(request_data));
    }
    send_join_group_request(room_uuid) {
        var request_data = {
            'room_uuid': room_uuid,
            'request_type': JOIN_GROUP,
        }
        this.socket.send(JSON.stringify(request_data));
    }
    send_leave_group_request(room_uuid) {
        var request_data = {
            'room_uuid': room_uuid,
            'request_type': LEAVE_GROUP,
        }
        this.socket.send(JSON.stringify(request_data));
    }
    send_create_private_room_request(user_id) {
        var request_data = {
            'user_id': Number(user_id),
            'request_type': CREATE_PRIVATE_ROOM,
        }
        this.socket.send(JSON.stringify(request_data));
    }
    send_connect_self_to_group_request(room_uuid) {
        var request_data = {
            'room_uuid': room_uuid,
            'request_type': CONNECT_SELF_TO_GROUP,
        }
        this.socket.send(JSON.stringify(request_data));
    }
}


// =================================================================================
// =================================================================================
//                Message handlers( apart from those that in Connection class)
// =================================================================================
// =================================================================================

function initialize_chat(all_data_json) {
    const all_data = JSON.parse(all_data_json);
    roomsData = (({ my_id, my_data, ...o }) => o)(all_data)
    console.log(roomsData)
    myData = all_data['my_data']
    myData["is_online"] = true
    console.log(myData)
    myId = all_data['my_id']
    console.log(myId)

    messagesContainer = new MessagesContainer(
        roomsData, myId, 
        message_callbacks, 
        message_menu_callbacks
    )

    chatsList = new ChatsList(roomsData, myId, chats_list_callbacks)
    chatsList.display_chats_list()

    input = new Input(input_callbacks)

    chatRoomTopnav = new ChatRoomTopNav(roomsData, myId)

    chatRoomInfo = new ChatRoomInfo(roomsData, myId, myData, chat_info_callbacks)

    messagesContainer.clear_msgs_flow()
    input.hide()
    chatRoomTopnav.hide()
}

function handle_new_message(message) {
    messagesContainer.handle_new_message_recieved(
        current_room_ref.current_room, message
    )

    const room_uuid = message['room_uuid']
    // chats_list.change_last_message_preview(room_uuid, message)
    chatsList.reload_room_last_msg_preview(room_uuid)
    chatsList.move_chat_preview_to_top(room_uuid)
    if (room_uuid != current_room_ref.current_room) {
        chatsList.increase_unread_msgs_count(room_uuid)
    }
}

function handle_mark_message_as_read(server_response) {
    if (server_response['readed_by'] == myId) { return }

    const msg_room = server_response['room_uuid']
    const msg_id = server_response['id']

    if (!messagesContainer.is_own_message(current_room_ref.current_room, msg_id)) { 
        return 
    }

    const msg_readed_by = server_response['readed_by']
    const msg_readed_at = server_response['readed_at']

    messagesContainer.mark_own_msg_as_read(
        current_room_ref.current_room, 
        msg_room, 
        msg_id, 
        msg_readed_by, 
        msg_readed_at
    )

    const room_messages = roomsData[msg_room]['messages']
    const last_message_in_room = room_messages[room_messages.length - 1]

    if (msg_id == last_message_in_room['id']) {
        chatsList.mark_preview_message_as_readed(msg_room)
    }
}

function handle_user_joined_online(server_response) {
    // check if id is self id
    const user_joined_online_id = server_response['id']
    if (myId == user_joined_online_id) {
        return
    }
    
    // update memory data
    const room_uuid = server_response['room_uuid']
    roomsData[room_uuid]['collocutors'][user_joined_online_id]['is_online'] = true

    // update left sidebar if room is private
    chatsList.reload_room_online_info(room_uuid)

    // update topbar if room is private and current // current_collocutor
    if (room_uuid == current_room_ref.current_room) {
        chatRoomTopnav.reload_room_online_info(room_uuid)

        // update right sidebar if room is private, current, and sidebar is shown
        if (chatRoomInfo.is_shown()) {
            chatRoomInfo.reload_room_online_info(room_uuid)
        }
    }
}

function handle_user_went_offline(message) {
    // check if id is self id
    const user_joined_online_id = message['id']
    if (myId == user_joined_online_id) {
        return
    }

    // update memory data
    const room_uuid = message['room_uuid']
    roomsData[room_uuid]['collocutors'][user_joined_online_id]['is_online'] = false

    // update left sidebar if room is private
    chatsList.reload_room_online_info(room_uuid)

    // update topbar if room is private and current
    if (room_uuid == current_room_ref.current_room) {
        chatRoomTopnav.reload_room_online_info(room_uuid)

        // update right sidebar if room is private, current, and sidebar is shown
        if (chatRoomInfo.is_shown()) {
            chatRoomInfo.reload_room_online_info(room_uuid)
        }
    }
}

function handle_new_group_created(chat_room_data) {
    
    // update memory
    const room_uuid = chat_room_data['room_uuid']
    connection.send_connect_self_to_group_request(room_uuid)
    const new_room_data = {
        "collocutors": {},
        "group_data": {
            "admin_id": myId,
            "avatar_uuid": chat_room_data["avatar_uuid"],
            "room_name": chat_room_data["group_name"],
        }, 
        "is_private": false,
        "messages": [],
    }
    roomsData[room_uuid] = new_room_data
    // add room to chatrooms list
    chatsList.add_new_group(room_uuid)
    // set topnav
    // set blank msg_flow
    // set blank input
    display_room(room_uuid)
}

function handle_member_added_to_group(server_response) {
    const room_uuid = server_response['room_uuid']
    const new_member_id = server_response['member_id']
    if (new_member_id == myId) {
        const room_info = server_response['room_info']
        roomsData[room_uuid] = room_info

        // add chat to chats list
        chatsList.add_new_group(room_uuid)
        return
    }

    const new_member_data = server_response['member_data']

    roomsData[room_uuid]['collocutors'][new_member_id] = new_member_data

    // add member to chat info
    if (room_uuid == current_room_ref.current_room) {
        chatRoomTopnav.reload_group_members_counter(room_uuid)
        if (chatRoomInfo.is_shown()) {
            chatRoomInfo.add_member_to_list(room_uuid, new_member_id)
        }
    }
    
}

function handle_member_removed_from_group(server_response) {
    const room_uuid = server_response['room_uuid']
    const member_id = server_response['member_id']

    if (member_id == myId) {
        delete roomsData[room_uuid]

        chatsList.remove_group(room_uuid)

        if (room_uuid == current_room_ref.current_room) {
            messagesContainer.clear_msgs_flow()
            input.hide()
            chatRoomTopnav.hide()
            
            current_room_ref = {'current_room': null}
            current_room = null
        }
        return
    }

    delete roomsData[room_uuid]['collocutors'][member_id]

    if (room_uuid == current_room_ref.current_room) {
        chatRoomTopnav.reload_group_members_counter(room_uuid)
        if (chatRoomInfo.is_shown()) {
            chatRoomInfo.remove_member_from_list(member_id)
        }
    }
}

function handle_join_group(server_response) {
    const room_uuid = server_response['room_uuid']
    const room_info = server_response['room_info']
    roomsData[room_uuid] = room_info

    chatsList.add_new_group(room_uuid)
    display_room(room_uuid)
}

function handle_create_private_room(server_response) {
    const room_uuid = server_response['room_uuid']
    const room_info = server_response['room_info']
    roomsData[room_uuid] = room_info

    chatsList.add_new_private_room(room_uuid)
    display_room(room_uuid)
}

// =================================================================================
// =================================================================================
//                                  Callback functions
// =================================================================================
// =================================================================================
// Input
var input_callbacks = (function(){
    async function upload_file_to_server(file) {
        const formData = new FormData();
        // formData.append('attached_file', document.querySelector('.main_input #attached_file').files[0])
        formData.append('attached_file', file)
        formData.append('csrfmiddlewaretoken', csrf_token)
        console.log(formData)
        try {
            const response = await fetch(`${window.location.origin}/files/upload`, {
                method: "POST",
                body: formData,
            });
            var responseData = await response.json();
        } catch (e) {
            console.error(e);
        }
        document.querySelector('.main_input #attached_file').value = ''
        console.log(responseData)
        return responseData['file_uuid']
    }

    /*============================ Public methods ========================== */
    function submit_input(event) {
        if (event.key == "Enter") {
            event.preventDefault()
            input.submit(current_room_ref.current_room)
            // duplicate move chat preview for pending messages
            chatsList.move_chat_preview_to_top(current_room_ref.current_room)
        }
    }
    function submit_message_on_button_click(event) {
        event.preventDefault()
        if (current_room_ref.current_room == 0) {
            return
        }
    
        input.submit(current_room_ref.current_room)
        // duplicate move chat preview for pending messages
        chatsList.move_chat_preview_to_top(current_room_ref.current_room)
    }

    function stop_editing() {
        input.delete_edit_info(current_room_ref.current_room)
        unshrink_messages_flow()
    }
    
    function shrink_messages_flow() {
        document.querySelector(".messages_flow").classList.add("shrinked");
    }
    
    function unshrink_messages_flow() {
        document.querySelector(".messages_flow").classList.remove("shrinked");
    }
    
    function update_message(room_uuid, message_text, msg_id) {
        connection.send_update_message_request(
            room_uuid,
            message_text,
            msg_id
        )
    }
    
    function send_message(room_uuid, message_text) {
        connection.send_message(
            room_uuid,
            message_text
        )
    
        messagesContainer.add_pending_message(room_uuid, message_text)
        messagesContainer.scroll_to_bottom()
    }

    async function submit_message_with_file(message_text, file_input) {
        const [prev_msg_id, index] = messagesContainer.add_pending_message_with_file(
            current_room_ref.current_room,
            message_text,
            file_input
        )
        messagesContainer.scroll_to_bottom()

        const file_uuid = await upload_file_to_server(file_input.files[0])

        messagesContainer.change_load_icon_to_file_icon(
            current_room_ref.current_room, 
            prev_msg_id, 
            index,
            file_uuid
        )

        connection.send_message(
            current_room_ref.current_room, 
            message_text, 
            null, file_uuid
        )
    }

    async function sumbit_message_with_img(message_text, img_input) {
        const [prev_msg_id, index] = messagesContainer.add_pending_message_with_img(
            current_room_ref.current_room,
            message_text,
            img_input
        )
        setTimeout(messagesContainer.scroll_to_bottom, 100)

        const img_uuid = await upload_file_to_server(img_input.files[0])

        messagesContainer.change_load_src_to_file_src(
            current_room_ref.current_room, 
            prev_msg_id, 
            index,
            img_uuid
        )

        connection.send_message(
            current_room_ref.current_room, 
            message_text,
            img_uuid, null
        )
    }

    return {
        submit_input,
        submit_message_on_button_click,
        stop_editing,
        shrink_messages_flow,
        unshrink_messages_flow,
        update_message,
        send_message,
        submit_message_with_file,
        sumbit_message_with_img,
    }
})()

// Messages flow
var message_callbacks = (function() {
    return {
        read_collocutor_message: function(msg_id) {
            connection.send_mark_message_as_read_request(msg_id)
            messagesContainer.mark_collocutor_message_as_read(
                current_room_ref.current_room, msg_id
            )
            chatsList.decrease_unread_msgs_count(current_room_ref.current_room)
        },
        
        reactButtonClicked: function(event) {
            let element = event.currentTarget
            console.log("react button clicked!!!!!!!")
            var msg_container = element.closest('.user_message')
            if (!msg_container) {
                msg_container = element.closest('.collocutor_message')
            }
            const msg_id = msg_container.getAttribute('msg_id')
            const emoji_unicode = element.getAttribute('emoji_unicode')
            const is_own_reaction = element.classList.contains('own_reaction')

            if (is_own_reaction) {
                connection.remove_reaction_from_message_request(
                    current_room_ref.current_room, msg_id
                )
                return
            }
            
            var reactions_container = element.closest('.reactions_container')
            
            if (reactions_container 
                && reactions_container.querySelector('.own_reaction')) {
                connection.remove_reaction_from_message_request(
                    current_room_ref.current_room, msg_id
                )
            }
            
            connection.add_reaction_to_message_request(
                current_room_ref.current_room,
                msg_id,
                emoji_unicode
            )
        }
    }
})()

var message_menu_callbacks = (function(){
    return {
        copyMessageTextToClipboard: function(event) {
            let element = event.currentTarget
            var msg_container = element.closest('.user_message')
            if (!msg_container) {
                msg_container = element.closest('.collocutor_message')
            }
            if (msg_container.classList.contains('message_with_author')
                || msg_container.classList.contains('message_with_file')
                || msg_container.classList.contains('message_with_img')) {
                const text_content_obj = msg_container.querySelector(
                    '.message_text_container'
                )
                var msg_text = text_content_obj.childNodes[0].textContent
            }
            else {
                var msg_text = msg_container.childNodes[0].textContent
            }

            navigator.clipboard.writeText(msg_text)
            element.closest('.message_menu').remove()
        },

        reactionChoiceClicked: function(event) {
            let element = event.currentTarget
            var msg_container = element.closest('.user_message')
            if (!msg_container) {
                msg_container = element.closest('.collocutor_message')
            }
            const msg_id = msg_container.getAttribute('msg_id')
            const emoji_unicode = element.getAttribute('emoji_unicode')
            
            var reactions_container = msg_container.querySelector(
                '.reactions_container'
            )
            if (reactions_container 
                && reactions_container.querySelector('.own_reaction')) {
                connection.remove_reaction_from_message_request(
                    current_room_ref.current_room, msg_id
                )
            }
            
            connection.add_reaction_to_message_request(
                current_room_ref.current_room,
                msg_id,
                emoji_unicode
            )
            element.closest('.message_menu').remove()
        },

        deleteParentElement: function(event) {
            let element = event.currentTarget
            element.parentElement.remove()
        },

        startEditing: function(event) {
            let element = event.currentTarget
            var msg_container = element.closest('.user_message')
            var msg_id = msg_container.getAttribute('msg_id')
            var msg_text = msg_container.childNodes[0].textContent

            element.closest('.message_menu').remove()

            input.add_edit_info(current_room_ref.current_room, msg_text, msg_id)
        },

        showDeletePopUp: function(event){
            let element = event.currentTarget

            var msg_container = element.closest('.user_message')
            var msg_id = msg_container.getAttribute('msg_id')

            element.closest('.message_menu').remove()

            var confirm_button = document.querySelector(
                '.pop_up_choices .confirm_button'
            )
            confirm_button.setAttribute('msg_id', msg_id)

            let popUpElement = document.querySelector('.pop_up_wraper')
            popUpElement.classList.toggle("hidden_pop_up");
        },
    }
})()

// Chats List
function display_room(room_uuid) {
    if (room_uuid == current_room_ref.current_room) {
        return
    }

    if (current_room_ref.current_room) {
        input.save_curr_input(current_room_ref.current_room)
        chatsList.mark_room_as_unactive(current_room_ref.current_room)
    }
    else {
        input.show()
        chatRoomTopnav.show()
    }
    
    current_room_ref.current_room = room_uuid
    chatsList.mark_room_as_active(room_uuid)
    messagesContainer.display_room_messages(room_uuid)
    chatRoomTopnav.display_current_chat_info(room_uuid)

    input.set_room_input(room_uuid)
    chatRoomInfo.hide()
}

var chats_list_callbacks = (function(){
    function hide_chat_menu() {
        const chat_menu = document.querySelector('.chat_menu_wrapper')
        chat_menu.classList.add("hidden")
        chat_menu.style.left = 0
        chat_menu.style.top = 0
    }
    function show_chat_menu() {
        const chat_menu = document.querySelector('.chat_menu_wrapper')
        chat_menu.classList.remove("hidden")
    }
    function move_chat_menu_to_cursor(cursor_x, cursor_y) {
        let chat_menu_element = document.querySelector('.chat_menu_wrapper')
        const element_position = chat_menu_element.getBoundingClientRect()
    
        const left_offset = -1 * (element_position['x'] - cursor_x)
        const top_offset = -1 * (element_position['y'] - cursor_y)
    
        chat_menu_element.style.left = `${left_offset}px`
        chat_menu_element.style.top = `${top_offset}px`
    }
    function set_chat_menu_room_uuid(room_uuid) {
        let chat_menu_element = document.querySelector('.chat_menu_wrapper')
        chat_menu_element.setAttribute('room_uuid', room_uuid)
    }
    function leave_clicked(event) {
        const room_uuid = event.currentTarget.closest('.chat_menu_wrapper').getAttribute('room_uuid')
        connection.send_leave_group_request(room_uuid)
        hide_chat_menu()
    }
    return {
        display_room_callback: function(event) {
            const element = event.currentTarget
            const room_uuid = element.getAttribute('room_uuid')
            display_room(room_uuid)
        },
        join_to_group: function(event) {
            const element = event.currentTarget
            const group_uuid = element.getAttribute('room_uuid')
            console.log("Trying to join group", group_uuid)
            connection.send_join_group_request(group_uuid)

            // clean input
            let input_el = document.querySelector('.search_input_container input')
            input_el.value = ''

            // display chats list
            chatsList.display_chats_list()
        },
        start_private_chat: function(event) {
            const element = event.currentTarget
            const user_id = element.getAttribute('collocutor_id')
            console.log("Trying to start chat with user", user_id)
            connection.send_create_private_room_request(user_id)

            // clean input
            let input_el = document.querySelector('.search_input_container input')
            input_el.value = ''

            // display chats list
            chatsList.display_chats_list()
        },
        context_menu_clicked: function(event) {
            event.preventDefault()
            const room_uuid = event.currentTarget.closest('.chat').getAttribute('room_uuid')
            set_chat_menu_room_uuid(room_uuid)
            show_chat_menu()
            move_chat_menu_to_cursor(event.clientX, event.clientY)
        },
        setup_chat_menu_event_listeners: function() {
            let menu_backdrop = document.querySelector('.chat_menu_backdrop')
            menu_backdrop.addEventListener('click', hide_chat_menu)
            let leave_button = document.querySelector('.chat_menu_options button.leave')
            leave_button.addEventListener('click', leave_clicked)
        },
    }
})()

// Chat info
var chat_info_callbacks = (function(){
    return {
        add_member_to_group: function(member_id, room_uuid) {
            connection.send_add_member_to_group_request(member_id, room_uuid)
        },
        remove_member_from_group: function(member_id, room_uuid) {
            connection.send_remove_member_from_group_request(member_id, room_uuid)
        }
    }
})()


// =================================================================================
// =================================================================================
//                          Set up and initialization
// =================================================================================
// =================================================================================

// initialize event listeners for buttons that are not in classes
function toggle_create_group_channel_menu_visility() {
    let menu = document.querySelector(
        '.add_channel_group_wrapper .add_channel_group_popup'
    )
    menu.classList.toggle("hidden");
}

function add_group_button_clicked() {
    setup_new_group_form()
    toggle_create_group_channel_menu_visility()
    let chats_list_and_search_bar = document.querySelector('.left_sidebar')
    chats_list_and_search_bar.classList.add("scrolled_into_second_section")
}

function add_channel_button_clicked() {
    setup_new_channel_form()
    toggle_create_group_channel_menu_visility()
    let chats_list_and_search_bar = document.querySelector('.left_sidebar')
    chats_list_and_search_bar.classList.add("scrolled_into_second_section")
}

function show_chats_list_and_search_bar() {
    let chats_list_and_search_bar = document.querySelector('.left_sidebar')
    chats_list_and_search_bar.classList.remove("scrolled_into_second_section")
}

function show_room_info() {
    chatRoomInfo.display_current_chat_info(current_room_ref.current_room)
    chatRoomInfo.show()
}

function hide_room_info() {
    chatRoomInfo.hide()
}

function toggle_popup_visibility() {
    let popUpElement = document.querySelector('.pop_up_wraper')
    popUpElement.classList.toggle("hidden_pop_up");
}

function delete_msg(event) {
    let element = event.currentTarget
    const msg_id = element.getAttribute("msg_id")
    connection.send_delete_message_request(current_room_ref.current_room, msg_id)
    toggle_popup_visibility()
}

var add_channel_group_menus = (function(){
    function loadGroupAvatarPreview(event) {
        const avatar_input_container = event.currentTarget.closest('.avatar_input')
        let preview_element = avatar_input_container.querySelector(
            'img.group_avatar_input_preview'
        )
        const file = event.target.files[0]
        if (file) {
            preview_element.src = URL.createObjectURL(file);
            preview_element.style.display = 'block'
        }
        else {
            preview_element.src = ''
            preview_element.style.display = 'none'
        }
    }

    function toggle_create_group_button_visibility(event) {
        let element = event.currentTarget
        const group_inputs = element.closest(".add_group_inputs")
        let submit_button = group_inputs.querySelector("button.create_group")
        if (element.value != '' 
            && !(submit_button.classList.contains("shown"))) {
            submit_button.classList.add("shown")
        }
        else if (element.value == '' 
                 && submit_button.classList.contains("shown")) {
            submit_button.classList.remove("shown")
        }
    }

    function remove_group_form() {
        let group_form_wrapper = document.querySelector('.add_group_menu_wrapper')
        group_form_wrapper.remove()
    }

    function setup_general_event_listeners() {
        // img
        let img_input = document.querySelector('input[name="group_avatar"]')
        img_input.addEventListener("change", loadGroupAvatarPreview)

        // name
        let name_input = document.querySelector('input[name="group_name"]')
        name_input.addEventListener(
            "keyup", toggle_create_group_button_visibility
        )

        //// close
        let close_menu = document.querySelector(
            '.add_group_menu_wrapper button.close_form'
        )
        close_menu.addEventListener("click", () => {
            show_chats_list_and_search_bar(),
            setTimeout(remove_group_form, 400)
        })
    }

    async function submitCreateGroup(event) {
        event.preventDefault()
        let form_element = event.currentTarget.closest('form')
    
        const formData = new FormData(form_element);
    
        try {
            const response = await fetch(`${window.location.origin}/create_group`, {
                method: "POST",
                body: formData,
            });
            var responseData = await response.json();
        } catch (e) {
            console.error(e);
        }
    
        console.log(responseData);
        let group_avatar_input = document.querySelector('.avatar_input input')
        group_avatar_input.value = ''
        let group_name_input = document.querySelector('.group_name_input input')
        group_name_input.value = ''
        show_chats_list_and_search_bar()
        handle_new_group_created(responseData)
    }

    async function submitCreateChannel(event) {
        event.preventDefault()
        console.log(event.currentTarget)
    }

    function channel_group_form_html(label) {
        const group_form_html = `
        <div class="add_group_menu_wrapper">
            <div class="topnav">
                <button class="close_form">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/>
                    </svg>
                </button>
                <div class="topnav_label">New ${label}</div>
            </div>
            <form method="POST" action="/create_group" class="add_group_inputs">
                <div class="avatar_input">
                    <input name="group_avatar" type="file" accept="image/png, image/jpeg"/>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                        <path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z"/>
                    </svg>
                    <img class="group_avatar_input_preview" src="#" onerror='this.style.display = "none"'>
                </div>
                <div class="group_name_input">
                    <label>Group name</label>
                    <input name="group_name" placeholer="Group Name" type="text" required/>
                </div>
                <input type="hidden" name="csrfmiddlewaretoken" value="${csrf_token}">
                <button class="create_group">
                    <svg xmlns="http://www.w3.org/2000/svg" stroke="white" stroke-width="1" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"/>
                    </svg>
                </button>
            </form>
        </div>
        `
        return group_form_html
    }

    return {
        new_group_form_html: function() {
            const label = 'Group'
            return channel_group_form_html(label)
        },

        new_channel_form_html: function() {
            const label = 'Channel'
            return channel_group_form_html(label)
        },

        setup_event_listeners_for_group_form() {
            setup_general_event_listeners()
            let submit_button = document.querySelector(
                '.add_group_inputs button.create_group'
            )
            submit_button.addEventListener("click", submitCreateGroup)
        },

        setup_event_listeners_for_channel_form() {
            setup_general_event_listeners()
            let submit_button = document.querySelector(
                '.add_group_inputs button.create_group'
            )
            submit_button.addEventListener("click", submitCreateChannel)
        }
    }
})()

function setup_new_group_form() {
    // create html
    const group_form_html = add_channel_group_menus.new_group_form_html()

    // insert html
    let sel_left_sidebar = document.querySelector('.left_sidebar')
    sel_left_sidebar.insertAdjacentHTML("beforeend", group_form_html)

    // set event listeners
    add_channel_group_menus.setup_event_listeners_for_group_form()    
}

function setup_new_channel_form() {
    // create html
    const channel_form_html = add_channel_group_menus.new_channel_form_html()

    // insert html
    let sel_left_sidebar = document.querySelector('.left_sidebar')
    sel_left_sidebar.insertAdjacentHTML("beforeend", channel_form_html)

    // set event listeners
    add_channel_group_menus.setup_event_listeners_for_channel_form()
}

async function onkeyup_search(event) {
    const input_el = event.currentTarget
    const search_text = input_el.value
    if (search_text == '') {
        chatsList.display_chats_list()
        return
    }

    // request to server with search_text
    try {
        const response = await fetch(`${window.location.origin}/api/chats_and_groups/${search_text}`, {
            method: "GET",
        });
        var responseData = await response.json();
    } catch (e) {
        console.error(e);
    }
    
    // response from server with search_text
    console.log(responseData)

    // clean chats list
    // display server response
    chatsList.display_search_result(responseData['groups'], responseData['users'])
}

// show add channel, group button 
let show_channel_group_button = document.querySelector('button.add_channel_group')
show_channel_group_button.addEventListener(
    "click", toggle_create_group_channel_menu_visility
)

// add group menu button
let add_group_button = document.querySelector(
    '.add_channel_group_popup button.add_group'
)
add_group_button.addEventListener("click", add_group_button_clicked)

// add channel button
let add_channel_button = document.querySelector(
    '.add_channel_group_popup button.add_channel'
)
add_channel_button.addEventListener("click", add_channel_button_clicked)

// show room info button
let show_room_info_button = document.querySelector(
    '.talk_options button.more_talk_info'
)
show_room_info_button.addEventListener("click", show_room_info)

// close delete msg popup
let cancel_delete_msg_popup_button = document.querySelector(
    '.pop_up_wraper button.cancel'
)
cancel_delete_msg_popup_button.addEventListener("click", toggle_popup_visibility)

// confirm delete msg button
let confirm_delete_msg_button = document.querySelector(
    '.pop_up_wraper button.confirm_button'
)
confirm_delete_msg_button.addEventListener("click", delete_msg)

// search
let search_bar = document.querySelector('.search_input_container input')
search_bar.addEventListener("keyup", onkeyup_search)

// init and start
var connection = new Connection()
