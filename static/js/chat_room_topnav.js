import {
    get_difference_between_now_and_date
} from "./time_functions.js"


// ===========================================================================================
// ===========================================================================================
//                                 Chat room topnav templates
// ===========================================================================================
// ===========================================================================================
var templates = (function(){
    return {
        collocutor_last_seen_html: function(last_seen) {
            var html = `
            <span class="last_seen">last seen <span class="when_last_seen">${last_seen}</span></span>
            `
            return html
        },
        
        collocutor_online_html: function() {
            const html = `
            <span class="collocutor_online">online</span>
            `
            return html
        },
    
        group_data_html: function(members_count, users_online_count) {
            let online_count_html = ''
            if (users_online_count > 0) {
                online_count_html = `<span class="online_count">, ${users_online_count} online</span>`
            }
        
            let members_count_text = `${members_count} member`
            if (members_count > 1) {
                members_count_text += 's'
            }
        
            const html = `
            <span class="group_data">
                <span class="members_count">${members_count_text}</span>${online_count_html}
            </span>`
        
            return html
        }
    }
})()

// ===========================================================================================
// ===========================================================================================
//                   This class is responsible for displaying chat room top nav
// ===========================================================================================
// ===========================================================================================
export class ChatRoomTopNav {
    constructor(room_messages, user_id) {
        this.topnav_info = document.querySelector('.collocutor_data .collocutor_meta')
        this.topnav_img = document.querySelector('.collocutor_data .collocutor_profile_img')
        this.room_name = document.querySelector('.collocutor_name')
        this.rooms_data = room_messages
        this.user_id = user_id
    }

    #display_private_chat_info(room_uuid) {
        const collocutor_id = Object.keys(this.rooms_data[room_uuid]['collocutors'])[0]
        const collocutor_data = this.rooms_data[room_uuid]['collocutors'][collocutor_id]

        this.room_name.innerText = collocutor_data['first_name']

        if (collocutor_data['is_online']) {
            this.topnav_info.innerHTML = templates.collocutor_online_html()
        }
        else {
            const when_was_last_login = get_difference_between_now_and_date(collocutor_data['last_login'])
            this.topnav_info.innerHTML = templates.collocutor_last_seen_html(when_was_last_login)
        }

        if (collocutor_data['avatar_img_uuid'] != '') {
            const url_to_avatar_img = window.location.origin + "/files/" + collocutor_data['avatar_img_uuid']
            this.topnav_img.innerHTML = `<img src="${url_to_avatar_img}">`
        }
        else {
            this.topnav_img.innerHTML = `<div class="image_thumb">${collocutor_data['first_name'][0]}</div>`
        }
    }

    #display_group_info(room_uuid) {
        // display group name
        const room_data = this.rooms_data[room_uuid]
        this.room_name.innerText = room_data['group_data']['room_name']

        // display avatar or thumb
        if (room_data['group_data']['avatar_uuid']) {
            const url_to_avatar_img = window.location.origin + "/files/" + room_data['group_data']['avatar_uuid']
            this.topnav_img.innerHTML = `<img src="${url_to_avatar_img}">`
        }
        else {
            this.topnav_img.innerHTML = `<div class="image_thumb">${room_data['group_data']['room_name'][0]}</div>`
        }

        // display count of members
        const members_count = Object.keys(room_data['collocutors']).length + 1

        // get users online count exept self 
        let users_online_count = 0
        for (let user_id of Object.keys(room_data['collocutors'])) {
            if (room_data['collocutors'][user_id]['is_online']) {
                users_online_count += 1
            }
        }

        this.topnav_info.innerHTML = templates.group_data_html(
            members_count,
            users_online_count
        )
    }

    display_current_chat_info(room_uuid) {
        if (this.rooms_data[room_uuid]['is_private']) {
            this.#display_private_chat_info(room_uuid)
        }
        else {
            this.#display_group_info(room_uuid) 
        }
    }

    hide() {
        let topnav_element = document.querySelector('.talk_top_nav')
        topnav_element.style.display = 'none'
    }

    show() {
        let topnav_element = document.querySelector('.talk_top_nav')
        topnav_element.style.display = 'flex'
    }

    reload_room_online_info(room_uuid) {
        const room_data = this.rooms_data[room_uuid]
        if (room_data['is_private']) {
            const collocutor_id = Object.keys(room_data['collocutors'])[0]
            const collocutor_data = room_data['collocutors'][collocutor_id]
            
            if (collocutor_data['is_online']) {
                if (!this.topnav_info.querySelector('.collocutor_online')) {
                    this.topnav_info.innerHTML = templates.collocutor_online_html()
                }
            }
            else {
                if (this.topnav_info.querySelector('.collocutor_online')) {
                    const when_was_last_login = get_difference_between_now_and_date(collocutor_data['last_login'])
                    this.topnav_info.innerHTML = templates.collocutor_last_seen_html(when_was_last_login)
                }
            }
        }
    }

    reload_group_members_counter(room_uuid) {
        const room_data = this.rooms_data[room_uuid]
        const members_count = Object.keys(room_data['collocutors']).length + 1

        // get users online count exept self 
        let users_online_count = 0
        for (let user_id of Object.keys(room_data['collocutors'])) {
            if (room_data['collocutors'][user_id]['is_online']) {
                users_online_count += 1
            }
        }

        this.topnav_info.innerHTML = templates.group_data_html(
            members_count,
            users_online_count
        )
    }
}