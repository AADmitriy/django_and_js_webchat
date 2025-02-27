
import {
    get_short_localized_date,
} from "./time_functions.js"

import {
    recieved_icon_html,
    readed_icon_html,
} from "./general_html.js"

// ===========================================================================================
// ===========================================================================================
//                                 Chat room list templates
// ===========================================================================================
// ===========================================================================================
var templates = (function() {
    function last_message_preview_info_html(last_msg_data, user_id) {
        if (!last_msg_data) {
            return '<div class="time_read"></div>'
        }
    
        const is_own_last_message = last_msg_data['author'] == user_id
    
        let is_last_message_read = null
        if (is_own_last_message) {
            is_last_message_read = Object.keys(last_msg_data['read_records']).length != 0
        }
        const last_message_date = get_short_localized_date(last_msg_data['created_at'])
    
        const html = `
        ${(is_own_last_message) ? 
        `<div class="has_read">
            ${(is_last_message_read) ? readed_icon_html() : recieved_icon_html()}
        </div>` 
        : ''}
        <div class="time_read">
            ${last_message_date}
        </div>
        `
        return html
    }
    
    function last_message_data_html(last_msg_data, unread_msgs_count, author=null) {
        if (!last_msg_data) {
            return '<div class="last_message_data"><div class="last_message"></div></div>';
        }
    
        const html = `
        <div class="last_message_data">
            <div class="last_message">
                ${(author) ?
                `<span class="last_msg_author">${author}</span><span class="colon">:</span>` :
                ''}
                ${last_msg_data['text']}
            </div>
            ${(unread_msgs_count) ? 
            unread_msgs_counter_html(unread_msgs_count)
            : '' }
        </div>
        `
        return html
    }

    // ============================ Public methods =====================================
    function unread_msgs_counter_html(unread_msgs_num) {
        let html = `
        <span class="unread_count">
            ${unread_msgs_num}
        </span>`
        return html
    }

    return {
        unread_msgs_counter_html,
        chat_side_info: function(collocutor_data, room_uuid, 
                                 last_msg_data, user_id, unread_msgs_count) {
            const has_avatar_img = collocutor_data['avatar_img_uuid'] != ""
            const url_to_avatar_img = window.location.origin + "/files/" 
                                      + collocutor_data['avatar_img_uuid']
            const name = collocutor_data['first_name']
            const is_online = collocutor_data['is_online']
        
            let html = `
            <div class="chat" room_uuid="${room_uuid}">
                <div class="chat_image">
                    ${ has_avatar_img ?
                    `<img src="${url_to_avatar_img}">` :
                    `<div class="image_thumb">
                        <div>${name[0]}</div>
                    </div>`}
                    ${ is_online ? 
                    `<div class="online"></div>` :
                    ''}
                </div>
                <div class="chat_info">
                    <div class="mini_chat_info">
                        <div class="chat_name_container">
                            <div class="chat_name">${name}</div>
                        </div>
                        <div class="message_info_preview">
                            ${last_message_preview_info_html(last_msg_data, user_id)} 
                        </div>
                    </div>
                    ${last_message_data_html(last_msg_data, unread_msgs_count)}
                </div>
            </div>`
        
            return html
        },

        group_side_info_html: function(room_uuid, group_room_data, collocutors_data,
                                       last_msg_data, user_id, unread_msgs_count) {
            const has_avatar_img = group_room_data['avatar_uuid'] != null
            const url_to_avatar_img = window.location.origin + "/files/" + group_room_data['avatar_uuid']
            const group_name = group_room_data["room_name"]
            let author_name = null
            console.log(last_msg_data)
            console.log(collocutors_data)
            if (last_msg_data && last_msg_data['author'] != user_id && collocutors_data) {
                if (!(last_msg_data['author'] in collocutors_data)) {
                    author_name = 'deleted user'
                }
                else {
                    author_name = collocutors_data[last_msg_data['author']]['first_name']
                }
            }
        
            let html = `
            <div class="chat group" room_uuid="${room_uuid}">
                <div class="chat_image">
                    ${ has_avatar_img ?
                    `<img src="${url_to_avatar_img}">` :
                    `<div class="image_thumb">
                        <div>${group_name[0]}</div>
                    </div>`}
                </div>
                <div class="chat_info">
                    <div class="mini_chat_info">
                        <div class="chat_name_container">
                            <div class="chat_name">${group_name}</div>
                        </div>
                        <div class="message_info_preview">
                            ${last_message_preview_info_html(last_msg_data, user_id)}
                        </div>
                    </div>
                    ${last_message_data_html(last_msg_data, unread_msgs_count, author_name)}
                </div>
            </div>`
        
            return html
        },

        search_chat_side_info: function(collocutor_data, collocutor_id) {
            const has_avatar_img = collocutor_data['avatar_img_uuid'] != ""
            const url_to_avatar_img = window.location.origin + "/files/" 
                            + collocutor_data['avatar_img_uuid']
            const name = collocutor_data['first_name']
            const is_online = collocutor_data['is_online']

            let html = `
            <div class="chat search_chat" collocutor_id="${collocutor_id}">
                <div class="chat_image">
                    ${ has_avatar_img ?
                    `<img src="${url_to_avatar_img}">` :
                    `<div class="image_thumb">
                    <div>${name[0]}</div>
                    </div>`}
                    ${ is_online ? 
                    `<div class="online"></div>` :
                    ''}
                </div>
                <div class="chat_info">
                    <div class="mini_chat_info">
                        <div class="chat_name_container">
                            <div class="chat_name">${name}</div>
                        </div>
                        <div class="message_info_preview">
                            <div class="time_read"></div>
                        </div>
                    </div>
                    <div class="last_message_data">
                        <div class="last_message">
                            ${collocutor_data['bio'] 
                            ? collocutor_data['bio'] 
                            : 'user has no bio'
                            }
                        </div>
                    </div>
                </div>
            </div>`

            return html
        },

        search_group_side_info_html: function(room_uuid, group_room_data, collocutors_data) {
            const has_avatar_img = group_room_data['avatar_uuid'] != null
            const url_to_avatar_img = window.location.origin + "/files/" + group_room_data['avatar_uuid']
            const group_name = group_room_data["room_name"]
            const members_count = Object.keys(collocutors_data).length

            let html = `
            <div class="chat search_group" room_uuid="${room_uuid}">
                <div class="chat_image">
                    ${ has_avatar_img ?
                    `<img src="${url_to_avatar_img}">` :
                    `<div class="image_thumb">
                    <div>${group_name[0]}</div>
                    </div>`}
                </div>
                <div class="chat_info">
                    <div class="mini_chat_info">
                        <div class="chat_name_container">
                            <div class="chat_name">${group_name}</div>
                        </div>
                        <div class="message_info_preview">
                            <div class="time_read"></div>
                        </div>
                    </div>
                    <div class="last_message_data">
                        <div class="last_message">${members_count} member${members_count > 1 ? 's':''}</div>
                    </div>
                </div>
            </div>`

            return html
        },
    }
})()


// ===========================================================================================
// ===========================================================================================
//                    This class is responsible for displaying chat room list
// ===========================================================================================
// ===========================================================================================
export class ChatsList {
    constructor(rooms_data, user_id, callbacks) {
        this.chats_list = document.querySelector('.chats_list')
        this.rooms_data = rooms_data
        this.user_id = user_id
        this.callbacks = callbacks
        this.callbacks.setup_chat_menu_event_listeners()
    }

    #set_chats_event_listeners() {
        let sel_chats = this.chats_list.querySelectorAll('.chat')
        const display_room_callback = this.callbacks.display_room_callback
        const context_menu_callback = this.callbacks.context_menu_clicked
        sel_chats.forEach(function(item, ind) {
            item.addEventListener('click', display_room_callback)
            if (item.classList.contains('group')) {
                item.addEventListener('contextmenu', context_menu_callback)
            }
        })
    }

    #get_last_message_of_room(room_uuid) {
        const messages = this.rooms_data[room_uuid]['messages']
        if (messages.length == 0) {
            return null
        }
        return messages[messages.length-1]
    }

    #get_count_of_unread_messages_in_room(room_uuid) {
        const messages = this.rooms_data[room_uuid]['messages']
        let unread_msgs_count = 0

        for (let index = messages.length - 1; index >= 0; index--) {
            const message_data = messages[index]
            if (message_data['author'] == this.user_id) {
                continue
            }

            if (message_data['readed_by_user']) {
                break
            }
            else {
                unread_msgs_count += 1
            }
        }

        return unread_msgs_count
    }

    display_chats_list() {
        let chats_list_html = "";
        for (let room_uuid in this.rooms_data) {
            const room_data = this.rooms_data[room_uuid]
            const last_msg = this.#get_last_message_of_room(room_uuid)
            const unread_msgs_count = this.#get_count_of_unread_messages_in_room(room_uuid)

            if (room_data['is_private']) {
                const collocutor_id = Object.keys(room_data['collocutors'])[0]
                const collocutor_data = room_data['collocutors'][collocutor_id]
                const chat_info_html = templates.chat_side_info(
                    collocutor_data, room_uuid,
                    last_msg, this.user_id, unread_msgs_count
                )
                chats_list_html += chat_info_html
            }
            else {
                const group_info_html = templates.group_side_info_html(
                    room_uuid, room_data['group_data'], room_data['collocutors'],
                    last_msg, this.user_id, unread_msgs_count
                )
                chats_list_html += group_info_html
            }
        }

        this.chats_list.innerHTML = chats_list_html
        this.#set_chats_event_listeners()
    }

    mark_room_as_active(room_uuid){
        this.chats_list.querySelector(`[room_uuid="${room_uuid}"]`).classList.add("active");
    }
    mark_room_as_unactive(room_uuid){
        this.chats_list.querySelector(`[room_uuid="${room_uuid}"]`).classList.remove("active");
    }

    decrease_unread_msgs_count(room_uuid) {
        let unread_msgs_counter = this.chats_list.querySelector(`[room_uuid="${room_uuid}"] .unread_count`)
        if (!unread_msgs_counter) {
            return
        }
        const new_count = Number(unread_msgs_counter.innerText) - 1
        if (new_count == 0) {
            unread_msgs_counter.remove()
        }
        else {
            unread_msgs_counter.innerText = new_count
        }
    }
    increase_unread_msgs_count(room_uuid) {
        let unread_msgs_counter = this.chats_list.querySelector(`[room_uuid="${room_uuid}"] .unread_count`)
        
        if (!unread_msgs_counter) {
            const counter_html = templates.unread_msgs_counter_html(1)
            let last_message_data_element = this.chats_list.querySelector(`[room_uuid="${room_uuid}"] .last_message_data`)
            last_message_data_element.insertAdjacentHTML("beforeend", counter_html)
        }
        else {
            const new_count = Number(unread_msgs_counter.innerText) + 1
            unread_msgs_counter.innerText = new_count
        }
    }

    change_last_message_preview(room_uuid, message) {
        const message_data = message['message_data']

        let chat_preview_element = this.chats_list.querySelector(`[room_uuid="${room_uuid}"]`)

        let message_text_container = chat_preview_element.querySelector('.last_message')
        message_text_container.innerText = message_data['text']

        let message_time_container = chat_preview_element.querySelector('.time_read')
        const new_message_time = get_short_localized_date(message_data['created_at'])
        message_time_container.innerText = new_message_time

        const is_own_message = message_data['author'] == this.user_id
        if (is_own_message) {
            let has_read_container = chat_preview_element.querySelector('.has_read')
            if (!has_read_container) {
                let has_read_html = `
                <div class="has_read">
                    ${recieved_icon_html()}
                </div>`
                chat_preview_element.querySelector('.message_info_preview').insertAdjacentHTML("afterbegin", has_read_html)
            }
            else {
                has_read_container.innerHTML = recieved_icon_html()
            }
            
        }
        else {
            let has_read_container = chat_preview_element.querySelector('.has_read')
            if (has_read_container) {
                has_read_container.remove()
            }
        }
    }

    mark_preview_message_as_readed(room_uuid) {
        let has_read_container = this.chats_list.querySelector(`[room_uuid="${room_uuid}"] .has_read`)
        if (!has_read_container) {
            return
        }
        has_read_container.innerHTML = readed_icon_html()
    }

    move_chat_preview_to_top(room_uuid) {
        let chat_room_preview = this.chats_list.querySelector(`[room_uuid="${room_uuid}"]`)
        this.chats_list.insertBefore(chat_room_preview, this.chats_list.children[0])
    }

    reload_room_online_info(room_uuid) {
        const room_data = this.rooms_data[room_uuid]
        if (room_data['is_private']) {
            const collocutor_id = Object.keys(room_data['collocutors'])[0]
            const collocutor_data = room_data['collocutors'][collocutor_id]
            let chat_image_html = this.chats_list.querySelector(`[room_uuid="${room_uuid}"] .chat_image`)

            if (collocutor_data['is_online']) {
                if (!chat_image_html.querySelector('.online')) {
                    chat_image_html.insertAdjacentHTML("beforeend", '<div class="online"></div>')
                }
            }
            else {
                if (chat_image_html.querySelector('.online')) {
                    chat_image_html.querySelector('.online').remove()
                }
            }
        }
    }
    reload_room_last_msg_preview(room_uuid) {
        let chat_preview_element = this.chats_list.querySelector(`[room_uuid="${room_uuid}"]`)
        let message_text_container = chat_preview_element.querySelector('.last_message')
        let message_time_container = chat_preview_element.querySelector('.time_read')
        let has_read_container = chat_preview_element.querySelector('.has_read')

        const room_messages_array = this.rooms_data[room_uuid]['messages']
        if (room_messages_array.length <= 0) {
            // clear all msg preview fields
            message_text_container.innerText = ''
            message_time_container.innerText = ''
            if (has_read_container) {
                has_read_container.remove()
            }
            return
        }

        const message_data = room_messages_array[room_messages_array.length - 1]

        message_text_container.innerText = message_data['text']

        const new_message_time = get_short_localized_date(message_data['created_at'])
        message_time_container.innerText = new_message_time

        const is_own_message = message_data['author'] == this.user_id
        if (!is_own_message) {
            if (has_read_container) {
                has_read_container.remove()
            }
            return
        }

        const is_last_message_read = Object.keys(message_data['read_records']).length > 0
        const message_status_icon = is_last_message_read ? readed_icon_html() : recieved_icon_html()

        if (!has_read_container) {
            let has_read_html = `
            <div class="has_read">
                ${message_status_icon}
            </div>`
            let message_meta_obj = chat_preview_element.querySelector('.message_info_preview')
            message_meta_obj.insertAdjacentHTML("afterbegin", has_read_html)
        }
        else {
            has_read_container.innerHTML = message_status_icon
        }
    }

    add_new_group(new_room_uuid) {
        const group_room_data = this.rooms_data[new_room_uuid]['group_data']
        const collocutors_data = this.rooms_data[new_room_uuid]['collocutors']
        const last_msg = this.#get_last_message_of_room(new_room_uuid)
        const unread_msgs_count = this.#get_count_of_unread_messages_in_room(new_room_uuid)
        const new_room_html = templates.group_side_info_html(
            new_room_uuid,
            group_room_data,
            collocutors_data, 
            last_msg,
            this.user_id,
            unread_msgs_count
        )
        this.chats_list.insertAdjacentHTML('afterbegin', new_room_html)

        let chat_preview_element = this.chats_list.querySelector(
            `[room_uuid="${new_room_uuid}"]`
        )
        chat_preview_element.addEventListener('click', this.callbacks.display_room_callback)
        chat_preview_element.addEventListener('contextmenu', this.callbacks.context_menu_clicked)
    }

    add_new_private_room(new_room_uuid) {
        const room_data = this.rooms_data[new_room_uuid]
        const collocutor_id = Object.keys(room_data['collocutors'])[0]
        const collocutor_data = room_data['collocutors'][collocutor_id]
        const chat_info_html = templates.chat_side_info(
            collocutor_data, new_room_uuid,
            null, this.user_id, 0
        )

        this.chats_list.insertAdjacentHTML('afterbegin', chat_info_html)

        let chat_preview_element = this.chats_list.querySelector(
            `[room_uuid="${new_room_uuid}"]`
        )
        chat_preview_element.addEventListener('click', this.callbacks.display_room_callback)
    }

    remove_group(room_uuid) {
        let chat_preview_element = this.chats_list.querySelector(
            `[room_uuid="${room_uuid}"]`
        )
        chat_preview_element.remove()
    }

    display_search_result(groups, users) {
        let chats_list_html = "";
        for (let room_uuid in groups) {
            const room_data = groups[room_uuid]
            const group_info_html = templates.search_group_side_info_html(
                room_uuid, room_data['group_data'], room_data['collocutors']
            )
            chats_list_html += group_info_html
        }

        this.chats_list.innerHTML = chats_list_html

        const search_groups = document.querySelectorAll('.search_group')
        search_groups.forEach(
            (group_preview) => group_preview.addEventListener("click", this.callbacks.join_to_group)
        )

        for (let collocutor_id in users) {
            const collocutor_data = users[collocutor_id]
            const chat_info_html = templates.search_chat_side_info(
                collocutor_data, collocutor_id
            )
            this.chats_list.insertAdjacentHTML('beforeend', chat_info_html)
        }

        const search_chats = document.querySelectorAll('.search_chat')
        search_chats.forEach(
            (chat_preview) => chat_preview.addEventListener("click", this.callbacks.start_private_chat)
        )
    }
}