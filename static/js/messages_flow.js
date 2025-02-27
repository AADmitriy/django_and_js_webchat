// Summary
// MessagesContainerHTML
//     mark_visible_messages_as_readed()
//     set_messages_flow_html(room_uuid, room_messages, pending_messages, user_id)
//     add_message_to_messages_flow_html(message_data, user_id)
//     add_pending_message_html(message_text, prev_msg_id, index)
//     change_pending_message_to_regular(prev_msg_id, pending_message_index, message_data, user_id)
//     scroll_to_bottom()
//     scroll_to_message(msg_id)
//     update_message_html(msg_id, msg_text)
//     update_message_html(msg_id) 
//     increase_reaction_count_html(msg_id, emoji_unicode, mark_as_own_reaction)
//     add_reaction_to_message_html(msg_id, emoji_unicode, mark_as_own_reaction)
//     decrease_reaction_count_html(msg_id, emoji_unicode, was_own_reaction)
//     remove_reaction_from_message_html(msg_id, emoji_unicode)
//     mark_own_message_as_read(msg_id)

// MessagesContainer
//    set_room_messages_and_user_id(messages_data)
//    scroll_to_first_unread_or_to_bottom(room_uuid)
//    display_room_messages(room_uuid)
//    add_message(current_room_uuid, message)
//    add_pending_message(room_uuid, message_text)
//    mark_pending_message_as_recieved(current_room_uuid, message)
//    handle_new_message_recieved(current_room_uuid, message)
//    scroll_to_bottom()
//    update_message(room_uuid, msg_id, msg_text)
//    delete_message(room_uuid, msg_id)
//    add_reaction_to_message(current_room, reaction_data)
//    remove_reaction_from_message(current_collocutor, reaction_data)
//    mark_collocutor_message_as_read(room_uuid, msg_id)
//    get_last_message_of_room(room_uuid) <- can be put in general
//    get_count_of_unread_messages_in_room(room_uuid) <- can be put in general


import {
    get_localized_date,
    get_hours_minutes,
    get_current_datetime,
    get_current_hours_minutes,
} from "./time_functions.js"

import {
    pending_icon_html,
    recieved_icon_html,
    readed_icon_html,
} from "./general_html.js"

// ===========================================================================================
// ===========================================================================================
//                    This class is responsible for messages templates
// ===========================================================================================
// ===========================================================================================
var templates = (function(){
    function date_label(date_str) {
        const html = `
        <div class="date_label_container"><span class="date_label">${date_str}</span></div>
        `
        return html
    }
    
    function message_updated_status_and_send_time_html(message_data) {
        const updated = message_data['updated']
        const send_time = get_hours_minutes(message_data['created_at'])
    
        const html = `
        <span class="message_send_time">
        ${updated ? 'edited ' : ''}
        ${send_time}</span>
        `
        return html
    }

    function pending_message_info(message_data, with_pending_icon = true) {
        const send_time = get_hours_minutes(message_data['created_at'])

        const html = `<span class="message_info">
            <span class="message_meta">
                <span class="message_send_time">${send_time}</span>
                <span class="message_read">
                    ${with_pending_icon ?
                    pending_icon_html() :
                    recieved_icon_html() 
                    }
                </span>
            </span>
        </span>`
        return html
    }

    function own_message_info_html(message_data, user_id) {
        const readed = Object.keys(message_data['read_records']).length !== 0;

        const html = `<span class="message_info">
            ${reactions_container_html(message_data['reactions'], user_id)}
            <span class="message_meta">
                ${message_updated_status_and_send_time_html(message_data)}
                <span class="message_read">
                    ${readed ? 
                    readed_icon_html() :
                    recieved_icon_html()
                    }
                </span>
            </span>
        </span>`
        return html
    }
    
    function collocutor_message_info_html(message_data, user_id) {
        const html = `<span class="message_info">
            ${reactions_container_html(message_data['reactions'], user_id)}
            <span class="message_meta">
                ${message_updated_status_and_send_time_html(message_data)}
            </span>
        </span>`
        return html
    }
    
    // ================================= Messages menus ====================================
    function reaction_choice_button_html(emoji_unicode) {
        const html = `
        <button class="reaction_choice" emoji_unicode="${emoji_unicode}">
                <span class="reaction_content">&#${emoji_unicode};</span>
        </button>
        `
        return html
    }

    function main_reactions_html() {
        const html = `
        <div class="message_react">`
            + reaction_choice_button_html(128077) 
            + reaction_choice_button_html(128561) 
            + reaction_choice_button_html(128565) 
            + reaction_choice_button_html(128514) 
            + reaction_choice_button_html(128586) 
            + reaction_choice_button_html(128562) 
            + reaction_choice_button_html(127881) 
            + `<button class="more_reactions">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                    <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/>
                </svg>
            </button>
        </div>
        `
        return html
    }

    function button_copy_text_html() {
        const html = `<button class="copy_text">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
            </svg>
            Copy Text
        </button>
        `
        return html
    }
    function file_content_html(file_data) {
        const html = `
        <div class="file_content">
            <div class="file_icon" ${!file_data['loaded'] 
                                     ? 'style="display:none"' 
                                     : `file_uuid="${file_data['file_uuid']}"`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293z"/>
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                </svg>
            </div>
            <div class="file_load_icon" ${file_data['loaded'] ? 'style="display:none"' : ''}></div>
            <div class="file_info">
                <div class="file_name">${file_data['name']}</div>
                <div class="file_size">${get_size_of_file(file_data['size'])}</div>
            </div>
        </div>`
        return html
    }

    function image_content_html(img_data) {
        let img_src = img_data['src']
        if (img_data['loaded']) {
            img_src =  window.location.origin + "/files/" + img_data['img_uuid']
        }
        const html = `
        <div class="img_content">
            <img src="${img_src}">
        </div>`
        return html
    }

    function message_author_avatar_html(collocutor_data) {
        const user_name = (collocutor_data) 
                           ? collocutor_data['first_name'] 
                           : 'deleted user'
        const user_avatar_uuid = (collocutor_data) 
                                  ? collocutor_data['avatar_img_uuid']
                                  : ''
        const user_has_avatar = (user_avatar_uuid && user_avatar_uuid != '')
        const url_to_avatar_img = window.location.origin + "/files/" + user_avatar_uuid

        const html = `
        <div class="msg_author_avatar">
            ${user_has_avatar ?
            `<img src="${url_to_avatar_img}">` :
            `<div class="image_thumb">${user_name[0]}</div>`
            }
        </div>`

        return html
    }

    // ============================ Public methods =====================================

    function create_reaction_html(emoji_unicode, is_own_reaction, count = 1) {
        var html = `
        <button class="${(is_own_reaction) ? 'own_reaction' : ''} reaction" emoji_unicode="${emoji_unicode}">
            <span class="reaction_content">&#${emoji_unicode};</span>
            <span class="reaction_count">${count}</span>
        </button>
        `
    
        return html
    }

    function reactions_container_html(reactions, user_id) {
        if (Object.keys(reactions).length == 0) {
            return ''
        }
        let html = `<div class="reactions_container">`
        
        for (const [emoji_unicode, authors] of Object.entries(reactions)) {
            const is_own_reaction = authors.hasOwnProperty(user_id)
            const reaction_count = Object.keys(authors).length
            html += create_reaction_html(emoji_unicode, is_own_reaction, reaction_count)
        }
        html += `</div>`
    
        return html
    }

    return {
        create_reaction_html,
        reactions_container_html,

        start_message_date_group: function(date_str) {
            let html = `
            <div class="message_date_group">
                ${date_label(date_str)} 
            `
            return html
        },

        end_message_date_group: function() {
            return `</div>`
        },

        pending_message_html: function(message_data, index, with_pending_icon=false) {
            const prev_msg_id = message_data['prev_msg_id']
            const message_text = message_data['text']

            const html = `
            <div class="user_message" prev_msg_id="${prev_msg_id}" index="${index}">${message_text}${
                pending_message_info(message_data, with_pending_icon)
                }
            </div>`
            return html
        },

        pending_message_with_loading_file_html: function(message_data, index) {
            const prev_msg_id = message_data['prev_msg_id']
            const message_text = message_data['text']
            const file_data = message_data['attachment_data']

            const html = `
            <div class="user_message message_with_file" prev_msg_id="${prev_msg_id}" index="${index}">
                ${file_content_html(file_data)}
                <div class="message_text_container">${message_text}${
                    pending_message_info(message_data)
                    }
                </div>
            </div>`

            return html
        },

        pending_message_with_img_html: function(message_data, index) {
            const prev_msg_id = message_data['prev_msg_id']
            const message_text = message_data['text']
            const img_data = message_data['attachment_data']

            const html = `
            <div class="user_message message_with_img" prev_msg_id="${prev_msg_id}" index="${index}">
                ${image_content_html(img_data)}
                <div class="message_text_container">${message_text}${
                    pending_message_info(message_data)
                    }
                </div>
            </div>`
            return html
        },

        own_message: function(message_data, user_id) {
            const id = message_data['id']
            const msg_text = message_data['text']
            const has_reactions = Object.keys(message_data['reactions']).length !== 0;
            const has_file = message_data['is_file_attached']
            const has_img = message_data['is_img_attached']
        
            const container_classes = 'user_message' + ' '
                                      + (has_reactions ? 'message_with_reactions ' : '')
                                      + (has_file ? 'message_with_file ' : '')
                                      + (has_img ? 'message_with_img ' : '')

            const message_info = own_message_info_html(message_data, user_id)
        
            let html = `<div class="${container_classes}" msg_id="${id}">`
            if (!has_img && !has_file) {
                html += `${msg_text}${message_info}`
            }
            else if (has_file) {
                const file_data = message_data['attachment_data']
                html += `${file_content_html(file_data)}
                <div class="message_text_container">${msg_text}${message_info}
                </div>`
            }
            else {
                const img_data = message_data['attachment_data']
                html += `${image_content_html(img_data)}
                <div class="message_text_container">${msg_text}${message_info}
                </div>`
            }
            html += '</div>'

            return html
        },

        collocutor_message: function(message_data, user_id) {
            const id = message_data['id']
            const msg_text = message_data['text']
            const has_reactions = Object.keys(message_data['reactions']).length !== 0;
            const readed = message_data['readed_by_user']
            const has_file = message_data['is_file_attached']
            const has_img = message_data['is_img_attached']
        
            const container_classes = 'collocutor_message' + ' '
                                      + (readed ? '' : 'unread ')
                                      + (has_reactions ? 'message_with_reactions ' : '')
                                      + (has_file ? 'message_with_file ' : '')
                                      + (has_img ? 'message_with_img ' : '')

            const message_info = collocutor_message_info_html(message_data, user_id)

            let html = `<div class="${container_classes}" msg_id="${id}">`
            if (!has_img && !has_file) {
                html += `${msg_text}${message_info}`
            }
            else if (has_file) {
                const file_data = message_data['attachment_data']
                html += `${file_content_html(file_data)}
                <div class="message_text_container">${msg_text}${message_info}
                </div>`
            }
            else {
                const img_data = message_data['attachment_data']
                html += `${image_content_html(img_data)}
                <div class="message_text_container">${msg_text}${message_info}
                </div>`
            }
            html += '</div>'
        
            return html
        },

        group_collocutor_message_html: function(collocutor_data, message_data, user_id) {
            const user_name = (collocutor_data) 
                               ? collocutor_data['first_name'] 
                               : 'deleted user'
        
            const id = message_data['id']
            const msg_text = message_data['text']
            const has_reactions = Object.keys(message_data['reactions']).length !== 0;
            const readed = message_data['readed_by_user']
            const has_file = message_data['is_file_attached']
            const has_img = message_data['is_img_attached']
        
            const container_classes = 'collocutor_message '
                                      + 'message_with_author '
                                      + (readed ? '' : 'unread ')
                                      + (has_reactions ? 'message_with_reactions ' : '')
                                      + (has_file ? 'message_with_file ' : '')
                                      + (has_img ? 'message_with_img ' : '')
        
            const html = `
            <div class="message_with_author_wraper">
                ${message_author_avatar_html(collocutor_data)}
                <div class="${container_classes}" msg_id="${id}">
                    <div class="message_author">
                        ${user_name}
                    </div>
                    ${has_file ? file_content_html(message_data['attachment_data']) : ''}
                    ${has_img ? image_content_html(message_data['attachment_data']) : ''}
                    <div class="message_text_container">${msg_text}${collocutor_message_info_html(message_data, user_id)}
                    </div>
                </div>
            </div>
            `
            return html
        },

        message_menu_html: function() {
            var html = `
            <div class="message_menu">
                <div class="backdrop"></div>`
                + main_reactions_html() +
                `<div class="message_options">`
                    + button_copy_text_html() +
                    `<button class="edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                        </svg>
                        Edit
                    </button>
                    <button class="delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                        </svg>
                        Delete
                    </button>
                </div>
            </div>`
            return html
        },

        collocutor_message_menu_html: function() {
            var html = `
            <div class="message_menu">
                <div class="backdrop"></div>`
                + main_reactions_html() +
                `<div class="message_options">`
                    + button_copy_text_html() +
                `</div>
            </div>`
            return html
        },

        pending_message_menu_html: function() {
            var html = `
            <div class="message_menu">
                <div class="backdrop"></div>
                <div class="message_options">`
                    + button_copy_text_html() +
                `</div>
            </div>`
            return html
        }
    }
})()

// ===========================================================================================
// ===========================================================================================
//                    This class is responsible for event listeners
// ===========================================================================================
// ===========================================================================================

function createEventListenersFunctions(message_callbacks, message_menu_callbacks) {
    function toggle_message_menu_html(message_element, menu_html) {
        if (message_element.querySelector(".message_menu")) {
            let menu = message_element.querySelector(".message_menu")
            menu.remove()
        } 
        else {
            message_element.insertAdjacentHTML('beforeend', menu_html)
        }
    }

    function shift_element_to_cursor(element, cursor_x, cursor_y) {
        const element_position = element.getBoundingClientRect()
    
        const left_offset = -1 * (element_position['x'] - cursor_x)
        const top_offset = -1 * (element_position['y'] - cursor_y)
    
        element.style.left = `${left_offset}px`
        element.style.top = `${top_offset}px`
    }

    function set_message_menu_event_listeners(menu_element) {
        // get backdrop
        let backdrop =  menu_element.querySelector('.backdrop')
        // set backdrop callback
        backdrop.addEventListener("click", message_menu_callbacks.deleteParentElement)

        // get reactions buttons
        let react_buttons = menu_element.querySelectorAll('.reaction_choice')
        // set reactions callbacks
        for (let i = 0; i < react_buttons.length; i++) {
            react_buttons[i].addEventListener("click", message_menu_callbacks.reactionChoiceClicked)
        }

        // get copy text button
        let copy_text_button = menu_element.querySelector('button.copy_text')
        // set copy text callback
        if (copy_text_button) {
            copy_text_button.addEventListener(
                "click",
                message_menu_callbacks.copyMessageTextToClipboard
            )
        }

        // get edit button
        let edit_msg_button = menu_element.querySelector('button.edit')
        // set edit callback
        if (edit_msg_button) {
            edit_msg_button.addEventListener("click", message_menu_callbacks.startEditing)
        }
        
        // get delete button
        let delete_msg_button = menu_element.querySelector('button.delete')
        // set delete callback
        if (delete_msg_button) {
            delete_msg_button.addEventListener("click", message_menu_callbacks.showDeletePopUp)
        }
    }

    function trigger_file_download(file_uuid) {
        const url = window.location.origin + "/files/" + file_uuid
        const a = document.createElement('a')
        a.href = url
        a.download = url.split('/').pop()
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    // ============================ Public methods =====================================

    function react_button_event_listeners(event) {
        message_callbacks.reactButtonClicked(event)
    }

    function own_message_event_listener(event) {
        event.preventDefault()
        let message_element = event.currentTarget
        const menu_html = templates.message_menu_html()
        toggle_message_menu_html(message_element, menu_html)
    
        const cursor_x = event.clientX;
        const cursor_y = event.clientY;
        let menu_element = this.querySelector('.message_menu')
        
        if (menu_element) {
            shift_element_to_cursor(menu_element, cursor_x, cursor_y)
            set_message_menu_event_listeners(menu_element)
        }
    }

    function collocutor_message_event_listener(event) {
        event.preventDefault()
        let message_element = event.currentTarget
        let menu_html = templates.collocutor_message_menu_html()
        toggle_message_menu_html(message_element, menu_html)

        const cursor_x = event.clientX;
        const cursor_y = event.clientY;
        let menu_element = this.querySelector('.message_menu')
        
        if (menu_element) {
            shift_element_to_cursor(menu_element, cursor_x, cursor_y)
            set_message_menu_event_listeners(menu_element)
        }
    }

    function pending_message_event_listener(event) {
        event.preventDefault()
        let message_element = event.currentTarget
        let menu_html = templates.pending_message_menu_html()
        toggle_message_menu_html(message_element, menu_html)

        const cursor_x = event.clientX;
        const cursor_y = event.clientY;
        let menu_element = this.querySelector('.message_menu')
        
        if (menu_element) {
            shift_element_to_cursor(menu_element, cursor_x, cursor_y)
            set_message_menu_event_listeners(menu_element)
        }
    }

    function download_file_event_listener(event) {
        const file_uuid = event.currentTarget.getAttribute('file_uuid')
        trigger_file_download(file_uuid)
    }

    return {
        react_button_event_listeners,
        own_message_event_listener,
        collocutor_message_event_listener,
        pending_message_event_listener,
        download_file_event_listener,
    }
}

var eventListenersFunctions = null

// ===========================================================================================
// ===========================================================================================
//                This class is responsible for changing and initializing html
// ===========================================================================================
// ===========================================================================================

var changeHtml = (function(){
    function set_react_buttons_event_listeners(message_element) {
        let react_buttons = message_element.querySelectorAll('button.reaction')
        for (let i = 0; i < react_buttons.length; i++) {
            react_buttons[i].addEventListener(
                "click", 
                eventListenersFunctions.react_button_event_listeners
            )
        }
    }

    function set_own_message_event_listeners(message_element) {
        message_element.addEventListener(
            "contextmenu",
            eventListenersFunctions.own_message_event_listener
        );

        set_react_buttons_event_listeners(message_element)
    }

    function set_collocutor_message_event_listeners(message_element) {
        message_element.addEventListener(
            "contextmenu",
            eventListenersFunctions.collocutor_message_event_listener
        );

        set_react_buttons_event_listeners(message_element)
    }

    function set_pending_message_event_listeners(message_element) {
        message_element.addEventListener(
            "contextmenu",
            eventListenersFunctions.pending_message_event_listener
        );
    }

    function set_msgs_event_listeners() {
        var own_messages = document.querySelectorAll(".user_message[msg_id]")
        var collocutor_messages = document.querySelectorAll(".collocutor_message")
        var pending_messages = document.querySelectorAll(".user_message[prev_msg_id][index]")

        for (let i = 0; i < own_messages.length; i++) {
            set_own_message_event_listeners(own_messages[i])
        }

        for (let i = 0; i < collocutor_messages.length; i++) {
            set_collocutor_message_event_listeners(collocutor_messages[i])
        }

        for (let i = 0; i< pending_messages.length; i++) {
            set_pending_message_event_listeners(pending_messages[i])
        }

        [...own_messages, ...collocutor_messages, ...pending_messages].forEach((message) => {
            if (message.querySelector('.file_icon')) {
                message.querySelector('.file_icon').addEventListener(
                    'click',
                    eventListenersFunctions.download_file_event_listener
                )
            }
        })
    }

    function get_message_reaction_element(msg_id, emoji_unicode) {
        const msg_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
        if (!msg_element) { return }

        const reaction_element = msg_element.querySelector(`[emoji_unicode="${emoji_unicode}"]`)
        
        return reaction_element
    }

    function change_reaction_count_by_num(reaction_element, num) {
        var reaction_count_element = reaction_element.querySelector('.reaction_count')
        const new_reaction_count = Number(reaction_count_element.textContent) + num
        reaction_count_element.textContent = new_reaction_count
    }

    function message_element_is_visible_or_already_scrolled_throught(message_element) {
        let sel_messages_flow = document.querySelector('.messages_flow')
        const messages_container_bottom_line = sel_messages_flow.getBoundingClientRect()['bottom']
        const message_element_bottom_line = message_element.getBoundingClientRect()['bottom']

        return (message_element_bottom_line <= messages_container_bottom_line)
    }

    function mark_message_as_read(message_element, mark_message_as_read_callback) { // <----- ???????????????????????????????????????????
        message_element.classList.toggle('unread')
        const msg_id = message_element.getAttribute('msg_id')

        mark_message_as_read_callback(msg_id)
    }

    function set_read_on_scroll_event_listener(mark_message_as_read_callback) {
        let sel_messages_flow = document.querySelector('.messages_flow')
        sel_messages_flow.addEventListener('scroll', () => {
            sel_messages_flow.querySelectorAll('.collocutor_message.unread').forEach(message => {
                if (message_element_is_visible_or_already_scrolled_throught(message)) {
                    mark_message_as_read(message, mark_message_as_read_callback);
                }
            });
        })
    }

    function add_message_html_to_messages_flow(message_html, message_created_at) {
        // select last message date group
        let sel_messages_flow = document.querySelector('.messages_flow')
        const all_messages_date_groups = sel_messages_flow.querySelectorAll('.message_date_group')
        const message_date = get_localized_date(message_created_at)

        if (all_messages_date_groups && all_messages_date_groups.length > 0) {
            let last_message_date_group_element = all_messages_date_groups[
                all_messages_date_groups.length - 1
            ]

            // compare dates
            const last_date = 
               last_message_date_group_element.querySelector('span.date_label').innerText
    
            if (message_date == last_date) {
                // insert message into last message date group
                last_message_date_group_element.insertAdjacentHTML('beforeend', message_html)
                return
            }
        }

        // wrap message into own date group and append to messages flow
        let html = templates.start_message_date_group(message_date)
                   + message_html 
                   + templates.end_message_date_group()
        sel_messages_flow.insertAdjacentHTML('beforeend', html)
    }

    // ============================ Public methods =====================================

    return { 
        mark_visible_messages_as_readed: function(mark_message_as_read_callback) {
            let sel_messages_flow = document.querySelector('.messages_flow')
            sel_messages_flow.querySelectorAll(
                '.messages_flow .collocutor_message.unread'
                ).forEach(message => {
                const messages_container_rect = sel_messages_flow.getBoundingClientRect()
                const message_element_rect = message.getBoundingClientRect()
    
                if (message_element_rect.top >= messages_container_rect.top
                    && message_element_rect.bottom <= messages_container_rect.bottom) {
                    mark_message_as_read(message, mark_message_as_read_callback);
                }
            });
        },

        set_messages_flow_html: function(room_data,
                                         user_id, 
                                         mark_message_as_read_callback) {
            
            const is_room_private = room_data['is_private']
            let msgs_flow_html = "";
            let date_str = null
            const room_messages = room_data['messages']

            for (let msg of room_messages) {
                // get date from msg
                let msg_date_str = get_localized_date(msg['created_at'])
                // if date changed insert data label in html
                if (msg_date_str != date_str) {
                    if (date_str) {
                        msgs_flow_html += templates.end_message_date_group()
                    }
                    msgs_flow_html += templates.start_message_date_group(msg_date_str)
                }
                date_str = msg_date_str
    
                if (msg['author'] != user_id) {
                    let collocutor_msg = null
                    if (is_room_private) {
                        collocutor_msg = templates.collocutor_message(msg, user_id)
                    }
                    else {
                        const collocutor_data = room_data['collocutors'][msg['author']]
                        collocutor_msg = templates.group_collocutor_message_html(
                            collocutor_data,
                            msg,
                            user_id
                        )
                    }
                    msgs_flow_html += collocutor_msg
                    continue
                }
                
                let own_msg = templates.own_message(msg,  user_id)
                msgs_flow_html += own_msg
            }
            

            const pending_messages = room_data['pending']
        
            // add pending messages at the end
            if (pending_messages) {
                let index = 0
                for (let msg of pending_messages) {
                    // get date from msg
                    let msg_date_str = get_localized_date(msg['created_at'])
                    // if date changed insert data label in html
                    if (msg_date_str != date_str) {
                        if (date_str) {
                            msgs_flow_html += templates.end_message_date_group()
                        }
                        msgs_flow_html += templates.start_message_date_group(msg_date_str)
                    }
                    date_str = msg_date_str
                    let pending_msg_html = null

                    if ('is_file_attached' in msg) {
                        pending_msg_html = templates.pending_message_with_loading_file_html(
                            msg,
                            index,
                        )
                    }
                    else if ('is_img_attached' in msg) {
                        pending_msg_html = templates.pending_message_with_img_html(
                            msg,
                            index
                        )
                    }
                    else {
                        pending_msg_html = templates.pending_message_html(
                            msg,
                            index,
                            with_pending_icon = true
                        )
                    }
                    msgs_flow_html += pending_msg_html
                    index += 1
                }
            }

            if (date_str) {
                msgs_flow_html += templates.end_message_date_group()
            }
    
            let sel_messages_flow = document.querySelector('.messages_flow')
            sel_messages_flow.innerHTML = msgs_flow_html
            set_msgs_event_listeners()
            set_read_on_scroll_event_listener(mark_message_as_read_callback)
        },

        add_message_to_messages_flow_html: function(message_data, user_id) {
            let message_html = null
            if (message_data['author'] == user_id) {
                message_html = templates.own_message(message_data,  user_id)
            }
            else {
                message_html = templates.collocutor_message(message_data, user_id)
            }
    
            add_message_html_to_messages_flow(message_html, message_data['created_at'])
    
            let msg_element = document.querySelector(`[msg_id="${message_data['id']}"]`)
            if (message_data['author'] == user_id) {
                set_own_message_event_listeners(msg_element)
            }
            else {
                set_collocutor_message_event_listeners(msg_element)
            }
        },

        add_pending_message_html: function(message_data, index) {
            const prev_msg_id = message_data['prev_msg_id']
            const message_html = templates.pending_message_html(
                message_data, index
            )
    
            add_message_html_to_messages_flow(message_html, message_data['created_at'])
    
            let pending_message_element = document.querySelector(
                `.messages_flow [prev_msg_id="${prev_msg_id}"][index="${index}"]`
            )
    
            set_pending_message_event_listeners(pending_message_element)
    
            setTimeout(() => {
                if (pending_message_element.getAttribute('prev_msg_id')) {
                    let has_read_element = pending_message_element.querySelector('.message_read')
                    has_read_element.innerHTML = pending_icon_html()
                }
            }, 2000)
        },

        add_pending_message_with_file_html: function(message_data, index) {
            const message_html = templates.pending_message_with_loading_file_html(
                message_data, 
                index,
            )
    
            add_message_html_to_messages_flow(message_html, message_data['created_at'])

            if (message_data['text']) {
                const prev_msg_id = message_data['prev_msg_id']
                let pending_message_element = document.querySelector(
                    `.messages_flow [prev_msg_id="${prev_msg_id}"][index="${index}"]`
                )
        
                set_pending_message_event_listeners(pending_message_element)
            }
        },

        add_pending_message_with_img_html: function(message_data, index) {
            const message_html = templates.pending_message_with_img_html(
                message_data, 
                index,
            )
    
            add_message_html_to_messages_flow(message_html, message_data['created_at'])

            if (message_data['text']) {
                const prev_msg_id = message_data['prev_msg_id']
                let pending_message_element = document.querySelector(
                    `.messages_flow [prev_msg_id="${prev_msg_id}"][index="${index}"]`
                )
        
                set_pending_message_event_listeners(pending_message_element)
            }
        },

        change_pending_message_to_regular: function(prev_msg_id,
                                                    pending_message_index,
                                                    message_data) {
            let pending_message_element = document.querySelector(
                `.messages_flow [prev_msg_id="${prev_msg_id}"][index="${pending_message_index}"]`
            )
    
            pending_message_element.removeAttribute('prev_msg_id')
            pending_message_element.removeAttribute('index')
            pending_message_element.setAttribute('msg_id', message_data['id'])
    
            let send_time_element = pending_message_element.querySelector('.message_send_time')
            send_time_element.innerHTML = get_hours_minutes(message_data['created_at'])
    
            let has_read_element = pending_message_element.querySelector('.message_read')
            has_read_element.innerHTML = recieved_icon_html()
    
            pending_message_element.removeEventListener(
                "contextmenu", eventListenersFunctions.pending_message_event_listener
            )
            set_own_message_event_listeners(pending_message_element)
        },

        scroll_to_bottom: function() {
            let sel_messages_flow = document.querySelector('.messages_flow')
            sel_messages_flow.scrollTop = sel_messages_flow.scrollHeight
        },
        
        scroll_to_message: function(msg_id) {
            let msg_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            msg_element.scrollIntoView(false)
        },

        update_message_html: function(msg_id, msg_text) {
            let message_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            if (!message_element) { return }
    
            message_element.childNodes[0].textContent = msg_text
            let message_meta = message_element.querySelector('.message_send_time')
            if (!(message_meta.textContent.includes('edited'))) {
                message_meta.insertAdjacentText('afterbegin', 'edited ')
            }
        },

        delete_message_html: function(msg_id) {
            var message_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            if (!message_element) { return }
    
            message_element.remove()
        },

        increase_reaction_count_html: function(msg_id, emoji_unicode, mark_as_own_reaction) {
            let reaction_element = get_message_reaction_element(msg_id, emoji_unicode)
            if (!reaction_element) { return }
    
            if (mark_as_own_reaction) {
                reaction_element.classList.toggle('own_reaction')
            }
        
            change_reaction_count_by_num(reaction_element, 1)
        },

        add_reaction_to_message_html: function(msg_id, emoji_unicode, mark_as_own_reaction) {
            const msg_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            if (!msg_element) { return }
    
            let reactions_container = msg_element.querySelector('.reactions_container')
    
            if (!reactions_container) {
                // add reactions container with reaction in it to message
                let reactions_container_html = `
                <div class="reactions_container">`
                    + templates.create_reaction_html(emoji_unicode, mark_as_own_reaction)
                + '</div>'
                
                let mgs_info = msg_element.querySelector('.message_info')
                mgs_info.insertAdjacentHTML('afterbegin', reactions_container_html)
                msg_element.classList.toggle('message_with_reactions')
            }
            else {
                // add reaction to reactions container
                let reaction_html = templates.create_reaction_html(
                    emoji_unicode,
                    mark_as_own_reaction
                )
                reactions_container.insertAdjacentHTML('beforeend', reaction_html)
            }

            let reaction_button = get_message_reaction_element(msg_id, emoji_unicode)
            reaction_button.addEventListener(
                "click",
                eventListenersFunctions.react_button_event_listeners
            )
        },

        decrease_reaction_count_html: function(msg_id, emoji_unicode, was_own_reaction) {
            let reaction_element = get_message_reaction_element(msg_id, emoji_unicode)
            if (!reaction_element) { return }
    
            if (was_own_reaction) {
                reaction_element.classList.toggle('own_reaction')
            }
    
            change_reaction_count_by_num(reaction_element, -1)
        },

        remove_reaction_from_message_html: function(msg_id, emoji_unicode) {
            let msg_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            if (!msg_element) { return }
    
            let reactions_container = msg_element.querySelector('.reactions_container')
            if (!reactions_container) { return }
    
            let reaction_element = msg_element.querySelector(`[emoji_unicode="${emoji_unicode}"]`)
            reaction_element.remove()
    
            const reaction_left_inside_container = reactions_container.querySelectorAll('.reaction').length
            if (reaction_left_inside_container == 0) {
                reactions_container.remove()
                msg_element.classList.toggle('message_with_reactions')
            }
        },

        mark_own_message_as_read: function(msg_id) {
            let msg_element = document.querySelector(`.messages_flow [msg_id="${msg_id}"]`)
            if (!msg_element) { return }
    
            let has_read_element = msg_element.querySelector('.message_read')
            has_read_element.innerHTML = readed_icon_html()
        },

        clear_msgs_flow_html: function() {
            let sel_messages_flow = document.querySelector('.messages_flow')
            sel_messages_flow.innerHTML = ''
        }
    }
})()

function get_size_of_file(bytes) {
    const kilobytes = bytes / 1024
    if (kilobytes < 1024) {
        return `${kilobytes.toFixed(2)} KB`
    }
    else {
        const megabytes = kilobytes / 1024
        return `${megabytes.toFixed(2)} MB`
    }
}

// ===========================================================================================
// ===========================================================================================
//                    This class is responsible for displaying messages
// ===========================================================================================
// ===========================================================================================
export class MessagesContainer {
    constructor(room_messages, user_id, message_callbacks, message_menu_callbacks) {
        this.user_id = user_id
        this.room_messages = room_messages
        this.message_callbacks = message_callbacks
        // this.message_menu_callbacks = message_menu_callbacks
        eventListenersFunctions = createEventListenersFunctions(
            message_callbacks, 
            message_menu_callbacks
        )
    }

    #find_msg_index_by_id(room_uuid, msg_id) {
        let messages_array = this.room_messages[room_uuid]['messages']
        let l = 0
        let r = messages_array.length - 1

        while (l <= r) {
            let mid = Math.floor((l + r) / 2);
            if (messages_array[mid]['id'] == msg_id) {
                return mid
            }
            else if (messages_array[mid]['id'] < msg_id) {
                l = mid + 1
            }
            else {
                r = mid - 1
            }
        }
        return -1
    }

    #get_pending_message_index(room_uuid, message_text) {
        let pending_messages = this.room_messages[room_uuid]['pending']
        let ind = 0;
        for (var msg of pending_messages) {
            if (msg['text'] == message_text) {
                return ind
            }
            ind = ind + 1
        }
        return -1
    }

    #get_id_of_first_unread_msg(room_uuid) {
        const messages = this.room_messages[room_uuid]['messages']

        for (let msg_data of messages) {
            if (msg_data['author'] == this.user_id) {
                continue
            }

            if (msg_data['readed_by_user'] == false) {
                return msg_data['id']
            }
        }

        return -1
    }

    scroll_to_first_unread_or_to_bottom(room_uuid) {
        const first_unread_msg_id = this.#get_id_of_first_unread_msg(room_uuid)
        if (first_unread_msg_id == -1) {
            this.scroll_to_bottom()
            return
        }

        changeHtml.scroll_to_message(first_unread_msg_id)
    }

    display_room_messages(room_uuid) {
        changeHtml.set_messages_flow_html(
            this.room_messages[room_uuid],
            this.user_id,
            this.message_callbacks.read_collocutor_message,
        )
        this.scroll_to_first_unread_or_to_bottom(room_uuid)
        changeHtml.mark_visible_messages_as_readed(
            this.message_callbacks.read_collocutor_message
        )
    }

    add_message(current_room_uuid, message) {
        const room_uuid = message['room_uuid']
        const message_data = message['message_data']
        this.room_messages[room_uuid]['messages'].push(message_data)

        if (current_room_uuid == room_uuid) {
            changeHtml.add_message_to_messages_flow_html(
                message_data,
                this.user_id)
        }
    }

    #add_to_pending_messages_array(room_uuid, message_text, attachment_data=null, img_attached = false) {
        const room_messages_array = this.room_messages[room_uuid]['messages']
        const prev_msg_id = ( room_messages_array.length > 0 ) ? 
                            room_messages_array[room_messages_array.length - 1]['id'] : 0
        let index = 0

        const message_data = {
            'text': message_text,
            'prev_msg_id': prev_msg_id,
            'created_at': get_current_datetime(),
        }
        if (attachment_data) {
            message_data['attachment_data'] = attachment_data
            if (img_attached) {
                message_data['is_img_attached'] = true
            }
            else {
                message_data['is_file_attached'] = true
            }
        }

        if (this.room_messages[room_uuid].hasOwnProperty('pending')) {
            index = this.room_messages[room_uuid]['pending'].push(message_data) - 1
        }
        else {
            this.room_messages[room_uuid]['pending'] = [message_data]
        }

        return [message_data, index]
    }

    add_pending_message(room_uuid, message_text) {
        const [message_data, index] = this.#add_to_pending_messages_array(room_uuid, message_text)

        changeHtml.add_pending_message_html(message_data, index)
    }

    add_pending_message_with_file(room_uuid, message_text, file_input) {
        const file_name = file_input.files[0].name
        const file_size = file_input.files[0].size

        let file_data = {'name': file_name, 'size': file_size, 'loaded': false}
        const [message_data, index] = this.#add_to_pending_messages_array(
            room_uuid, 
            message_text,
            file_data,
        )
        changeHtml.add_pending_message_with_file_html(
            message_data, index
        )
        return [message_data['prev_msg_id'], index]
    }

    add_pending_message_with_img(room_uuid, message_text, img_input) {
        const img_src = URL.createObjectURL(img_input.files[0])
        let img_data = {'src': img_src, 'loaded': false}

        const [message_data, index] = this.#add_to_pending_messages_array(
            room_uuid, 
            message_text,
            img_data,
            true
        )
        changeHtml.add_pending_message_with_img_html(
            message_data, index
        )
        return [message_data['prev_msg_id'], index]
    }

    change_load_icon_to_file_icon(room_uuid, prev_msg_id, index, file_uuid) {
        this.room_messages[room_uuid]['pending'][index]['attachment_data']['loaded'] = true
        this.room_messages[room_uuid]['pending'][index]['attachment_data']['file_uuid'] = file_uuid

        const msg_element = document.querySelector(
            `[prev_msg_id="${prev_msg_id}"][index="${index}"]`
        )
        if (msg_element) {
            msg_element.querySelector('.file_load_icon').style.display = 'none'

            const file_icon_element = msg_element.querySelector('.file_icon')
            file_icon_element.style.display = 'block'
            file_icon_element.setAttribute('file_uuid', file_uuid)
            file_icon_element.addEventListener(
                "click",
                eventListenersFunctions.download_file_event_listener
            )
        }
    }

    change_load_src_to_file_src(room_uuid, prev_msg_id, index, img_uuid) {
        this.room_messages[room_uuid]['pending'][index]['attachment_data']['loaded'] = true
        this.room_messages[room_uuid]['pending'][index]['attachment_data']['img_uuid'] = img_uuid

        const msg_element = document.querySelector(
            `[prev_msg_id="${prev_msg_id}"][index="${index}"]`
        )
        if (msg_element) {
            const img_element = msg_element.querySelector('.img_content img')
            const new_src_to_img = window.location.origin + "/files/" + img_uuid
            img_element.src = new_src_to_img
        }
        
    }

    mark_pending_message_as_recieved(current_room_uuid, message) {
        const room_uuid = message['room_uuid']
        const message_data = message['message_data']
        this.room_messages[room_uuid]['messages'].push(message_data)

        const pending_message_index = this.#get_pending_message_index(
            room_uuid, message_data['text']
        )
        let pending_messages_array = this.room_messages[room_uuid]['pending']
        const prev_msg_id = pending_messages_array[pending_message_index]['prev_msg_id']

        pending_messages_array.splice(pending_message_index, 1)

        if (current_room_uuid == room_uuid) {
            changeHtml.change_pending_message_to_regular(
                prev_msg_id,
                pending_message_index,
                message_data
            )
        }
    }

    handle_new_message_recieved(current_room_uuid, message) {
        if (message['message_data']['author'] == this.user_id) {
            this.mark_pending_message_as_recieved(current_room_uuid, message)
        }
        else {
            this.add_message(current_room_uuid, message)
        }
        changeHtml.scroll_to_bottom()
    }

    scroll_to_bottom() {
        changeHtml.scroll_to_bottom()
    }

    update_message(room_uuid, msg_id, msg_text) {
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) { return }

        this.room_messages[room_uuid]['messages'][msg_index]['text'] = msg_text
        this.room_messages[room_uuid]['messages'][msg_index]['updated'] = true

        changeHtml.update_message_html(msg_id, msg_text)
    }

    delete_message(room_uuid, msg_id) {
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) { return }

        this.room_messages[room_uuid]['messages'].splice(msg_index, 1)

        changeHtml.delete_message_html(msg_id)
    }

    add_reaction_to_message(current_room, reaction_data) {
        const room_uuid = reaction_data['room_uuid']
        const msg_id = reaction_data['id']
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) { return }

        const reactions =  this.room_messages[room_uuid]['messages'][msg_index]['reactions']
        const emoji_unicode = reaction_data['emoji_unicode']
        const author_id = reaction_data['author']
        const reaction_created_at = reaction_data['created_at']

        const mark_as_own_reaction = author_id == this.user_id
        const reaction_with_such_emoji_exists = reactions.hasOwnProperty(emoji_unicode)

        // Update data
        if (reaction_with_such_emoji_exists) {
            reactions[emoji_unicode][author_id] = reaction_created_at
        }
        else {
            reactions[emoji_unicode] = {[author_id]: reaction_created_at}
        }

        if (current_room != room_uuid) { return }

        // Update HTML
        if (reaction_with_such_emoji_exists) {
            changeHtml.increase_reaction_count_html(msg_id, emoji_unicode, mark_as_own_reaction)
        }
        else {
            changeHtml.add_reaction_to_message_html(msg_id, emoji_unicode, mark_as_own_reaction)
        }
    }

    remove_reaction_from_message(current_collocutor, reaction_data) {
        const room_uuid = reaction_data['room_uuid']
        const msg_id = reaction_data['id']
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) {
            return
        }

        const reactions =  this.room_messages[room_uuid]['messages'][msg_index]['reactions']
        const emoji_unicode = reaction_data['emoji_unicode']
        const author_id = reaction_data['author']

        if (!reactions.hasOwnProperty(emoji_unicode)) {
            console.log("Invalid emoji_unicode passed to MessageContainer.remove_reaction_from_message()")
            return
        }

        if (!reactions[emoji_unicode].hasOwnProperty(author_id)) {
            console.log("Invalid author_id passed to MessageContainer.remove_reaction_from_message()")
            return
        }

        delete reactions[emoji_unicode][author_id]
        const reaction_authors_left = Object.keys(reactions[emoji_unicode]).length

        if (reaction_authors_left > 0) {
            if (current_collocutor == room_uuid) {
                const was_own_reaction = this.user_id == author_id
                changeHtml.decrease_reaction_count_html(msg_id, emoji_unicode, was_own_reaction)
            }
            return
        }

        delete reactions[emoji_unicode]
        const reactions_left = Object.keys(reactions).length

        if (current_collocutor == room_uuid) {
            changeHtml.remove_reaction_from_message_html(msg_id, emoji_unicode)
        }
    }

    mark_collocutor_message_as_read(room_uuid, msg_id) {
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) { return }

        let message_data = this.room_messages[room_uuid]['messages'][msg_index]

        if (!message_data.hasOwnProperty('readed_by_user')) {
            return
        }
        message_data['readed_by_user'] = true
    }

    is_own_message(room_uuid, msg_id) {
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) {
            return false
        }
        
        const message_data = this.room_messages[room_uuid]['messages'][msg_index]

        return message_data['author'] == this.user_id
    }
 
    mark_own_msg_as_read(current_collocutor, room_uuid, msg_id, readed_by, readed_at) {
        const msg_index = this.#find_msg_index_by_id(room_uuid, msg_id)
        if (msg_index == -1) { return }

        let message_data = this.room_messages[room_uuid]['messages'][msg_index]

        if (message_data['author'] != this.user_id) { return }

        message_data['read_records'][readed_by] = readed_at

        if (current_collocutor == room_uuid) {
            changeHtml.mark_own_message_as_read(msg_id)
        }
    }

    clear_msgs_flow() {
        changeHtml.clear_msgs_flow_html()
    }
}
