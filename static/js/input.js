
var templates = (function(){
    return {
        edit_info_html: function(msg_text) {
            var html = `
            <div class="edit_info">
                <div class="edit_icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                </div>
                <div class="msg_to_edit">
                    <p class="edit_msg_label">Edit Message</p>
                    <p class="edit_msg_preview">${msg_text}</p>
                </div>
                <button onclick="stopEditing()">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                    </svg>
                </button>
            </div>
            `
            return html
        }
    }
})()


// ===========================================================================================
// ===========================================================================================
// This class is responsible for displaying input status, submiting input, saving input between different chats
// ===========================================================================================
// ===========================================================================================
export class Input {
    constructor(callbacks) {
        this.message_input = document.querySelector('.message_input')
        this.input_container = document.querySelector('.main_input_info')
        this.rooms_inputs = {}
        this.callbacks = callbacks
        this.#set_enter_event_listener()
        this.#set_submit_button_event_listener()
    }

    #set_enter_event_listener() {
        this.message_input.addEventListener('keydown', this.callbacks.submit_input)
    }

    #set_submit_button_event_listener() {
        let submit_button = document.querySelector('.message_input_options button.submit_msg')
        submit_button.addEventListener('click', this.callbacks.submit_message_on_button_click)
    }

    #set_edit_info_event_listeners() {
        let stop_editing_button = this.input_container.querySelector(".edit_info button")
        stop_editing_button.addEventListener('click', this.callbacks.stop_editing)
    }

    hide() {
        let message_form = document.querySelector('.message_input_options')
        message_form.style.display = 'none'
    }
    show() {
        let message_form = document.querySelector('.message_input_options')
        message_form.style.display = 'flex'
    }

    save_curr_input(room_uuid) {
        var text = this.message_input.value

        if ((text != '') && !(room_uuid in this.rooms_inputs)) {
            this.rooms_inputs[room_uuid] = {
                'text': text,
                'is_edit': false
            }
        }
        else if (room_uuid in this.rooms_inputs) {
            this.rooms_inputs[room_uuid]['text'] = text
        }
    }
    add_edit_info(room_uuid, text, msg_id) {
        this.rooms_inputs[room_uuid] = {
            'text': text,
            'is_edit': true,
            'msg_id': msg_id
        }
        if (this.input_container.querySelector(".edit_info")) {
            this.input_container.querySelector(".edit_info").remove()
        }
        var html = templates.edit_info_html(text)
        this.input_container.insertAdjacentHTML("afterbegin", html)
        this.#set_edit_info_event_listeners()
        this.message_input.value = text
        this.callbacks.shrink_messages_flow()
    }

    delete_edit_info(room_uuid) {
        delete this.rooms_inputs[room_uuid]
        if (this.input_container.querySelector(".edit_info")) {
            this.input_container.querySelector(".edit_info").remove()
            this.callbacks.unshrink_messages_flow()
        }
        this.message_input.value = ''
    }

    set_room_input(room_uuid) {
        if (this.input_container.querySelector(".edit_info")) {
            this.input_container.querySelector(".edit_info").remove()
            this.callbacks.unshrink_messages_flow()
        }
        if (!(room_uuid in this.rooms_inputs)) {
            this.message_input.value = ''
            return
        }

        var text = this.rooms_inputs[room_uuid]['text']
        
        if (this.rooms_inputs[room_uuid]['is_edit']) {
            var html = templates.edit_info_html(text)
            this.input_container.insertAdjacentHTML("afterbegin", html)
            this.#set_edit_info_event_listeners()
            this.callbacks.shrink_messages_flow()
        }

        this.message_input.value = text
    }

    submit(room_uuid) {
        if (!room_uuid) {
            return
        }
        var message_text = this.message_input.value
        
        if ((room_uuid in this.rooms_inputs) && this.rooms_inputs[room_uuid]['is_edit']) {
            this.callbacks.update_message(
                room_uuid,
                message_text,
                this.rooms_inputs[room_uuid]['msg_id']
            )
            this.delete_edit_info(room_uuid)
        }
        else {
            this.callbacks.send_message(room_uuid, message_text)

            this.message_input.value = ''
        }
    }
}
