import {
    get_difference_between_now_and_date
} from "./time_functions.js"

// ===========================================================================================
// ===========================================================================================
//                             Chat room right side info templates
// ===========================================================================================
// ===========================================================================================
var templates = (function(){
    function group_member_html(user_data, is_admin, user_id) {
        const has_avatar = user_data['avatar_img_uuid'] && user_data['avatar_img_uuid'] != ''
        const url_to_avatar_img = window.location.origin + "/files/" + user_data['avatar_img_uuid']
        const user_name = user_data['first_name']
    
        if (!user_data['is_online']) {
            var when_was_last_login = get_difference_between_now_and_date(user_data['last_login'])
        }
    
        const html = `
        <div class="group_member_data" ${user_id ? `member_id="${user_id}"` : ''}>
            <div class="member_avatar">
                ${ has_avatar ? 
                `<img src="${url_to_avatar_img}">` :
                `<div class="image_thumb">${user_name[0]}</div>`
                }
            </div>
            <div class="member_text_info">
                <div class="info_name_title">
                    <div class="member_name">
                       ${user_name}
                    </div>
                    ${ is_admin ?
                    `<div class="member_title">
                        admin
                    </div>` :
                    ''
                    }
                </div>
                <div class="status">
                    ${ user_data['is_online'] ?
                    '<span class="online_member_status">online</span>' :
                    `<span class="last_seen_member_container">
                        last seen
                        <span class="last_seen_member">${when_was_last_login}</span>
                    </span>`
                    }
                </div>
            </div>
        </div>
        `
        return html
    }
    return {
        group_member_html,
        profile_last_seen_html: function(last_seen) {
            const html = `
            <div class="profile_last_seen">last seen <span class="last_seen">${last_seen}</span></div>
            `
            return html
        },
        
        profile_online_html: function() {
            const html = `
            <div class="profile_online">online</div>
            `
            return html
        },
        
        profile_bio_html: function(bio) {
            const html = `
            <div class="profile_bio">
                <div class="bio_icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/>
                    </svg>
                </div>
                <div class="profile_bio_text_container">
                    <div class="profile_bio_text_label">Bio:</div>
                    <div class="profile_bio_text">${bio}</div>
                </div>
            </div>
            `
            return html
        },
        
        profile_username_html: function(username) {
            const html = `
            <div class="profile_username">
                <div class="username_icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914"/>
                    </svg>
                </div>
                <div class="profile_username_text_container">
                    <div class="profile_username_text_label">Username</div>
                    <div class="profile_username_text">${username}</div>
                </div>
            </div>
            `
            return html
        },
        
        group_members_counter_html: function(members_count) {
            const html = `
            <div class="members_counter_container">
                <span class="members_counter">${members_count}</span> members
            </div>
            `
            return html
        },
        
        
        
        group_members_list_html: function(group_members_dict,
                                          admin_id,
                                          user_id,
                                          user_data) {
            let html = `<div class="group_members_list">`
            html += group_member_html(user_data, user_id == admin_id)
        
            // add online users first
            for (let user_id in group_members_dict) {
                if (group_members_dict[user_id]['is_online']) {
                    const is_user_admin = user_id == admin_id
                    html += group_member_html(
                        group_members_dict[user_id],
                        is_user_admin,
                        user_id
                    )
                }
            }
        
            // add offline users
            for (let user_id in group_members_dict) {
                if (!group_members_dict[user_id]['is_online']) {
                    const is_user_admin = user_id == admin_id
                    html += group_member_html(
                        group_members_dict[user_id],
                        is_user_admin,
                        user_id
                    )
                }
            }
        
            html += '</div>'
        
            return html
        },

        manage_group_button_html: function() {
            const html = `
            <div class="group_options_wrapper">
                <button class="toggle_group_menu">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z"/>
                    </svg>
                </button>
                <div class="group_menu_popup hidden">
                    <button class="add_user_to_group">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                            <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                        </svg>
                        Add User
                    </button>
                    <button class="remove_user">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M11 12h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1 0-1m0-7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
                            <path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"/>
                        </svg>
                        Remove User
                    </button>
                </div>
            </div>
            `
            return html
        },

        add_member_selection_html: function(rooms_data, group_members_dict) {
            let html = `
            <div class="user_to_add_selection_wrapper">
                <div class="conversation_info_topbar">
                    <button class="close_conversation_info close_add_member_selection">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/>
                        </svg>
                    </button>
                    <div class="info_type">Add Member</div>
                </div>
                <div class="members_to_add">`

            for (let room_data of Object.values(rooms_data)) {
                if (!room_data['is_private']) {
                    continue
                }
                const collocutor_id = Object.keys(room_data['collocutors'])[0]
                if (collocutor_id in group_members_dict) {
                    continue
                }
                const is_user_admin = false
                html += `
                <button class="member_to_add_option" member_id="${collocutor_id}">
                ` + group_member_html(
                        room_data['collocutors'][collocutor_id],
                        is_user_admin
                    )
                + `</button>`
            }

            html += `</div>
            </div>
            `
            return html
        },

        remove_member_selection_html: function(group_members_dict, admin_id) {
            let html = `
            <div class="user_to_remove_selection_wrapper">
                <div class="conversation_info_topbar">
                    <button class="close_conversation_info close_remove_member_selection">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5"/>
                        </svg>
                    </button>
                    <div class="info_type">Remove Member</div>
                </div>
                <div class="members_to_remove">`

            // add online users first
            for (let user_id in group_members_dict) {
                if (group_members_dict[user_id]['is_online']) {
                    const is_user_admin = user_id == admin_id
                    html += `
                    <button class="member_to_remove_option danger_hover" member_id="${user_id}">
                    ` + group_member_html(group_members_dict[user_id], is_user_admin)
                    + `</button>`
                }
            }
        
            // add offline users
            for (let user_id in group_members_dict) {
                if (!group_members_dict[user_id]['is_online']) {
                    const is_user_admin = user_id == admin_id
                    html += `
                    <button class="member_to_remove_option danger_hover" member_id="${user_id}">
                    ` + group_member_html(group_members_dict[user_id], is_user_admin)
                    + `</button>`
                }
            }
            
            html += `</div>
            </div>
            `
            return html
        }
    }
})()

// ===========================================================================================
// ===========================================================================================
//              This class is responsible for displaying chat room right side info
// ===========================================================================================
// ===========================================================================================
export class ChatRoomInfo {
    constructor(room_messages, user_id, user_data, callbacks) {
        this.container = document.querySelector('.conversation_info')
        this.room_meta = document.querySelector('.conversation_info .profile_meta')
        this.room_img = document.querySelector('.conversation_info .profile_photo')
        this.additional_info = document.querySelector('.profile_additional_info')
        this.room_name_html = this.container.querySelector('.profile_name')
        this.rooms_data = room_messages
        this.user_id = user_id
        this.user_data = user_data
        this.callbacks = callbacks
        this.#set_close_button_event_listener()
    }

    #set_close_button_event_listener() {
        let close_room_info_button = document.querySelector(
            '.conversation_info .close_conversation_info'
        )
        const _self = this
        close_room_info_button.addEventListener("click", () => _self.hide())
    }

    #toggle_group_menu() {
        let sel_group_menu_popup = document.querySelector(
            '.group_options_wrapper .group_menu_popup'
        )
        sel_group_menu_popup.classList.toggle('hidden')
    }

    #set_manage_group_button_event_listeners(room_uuid) {
        let buttons_wrapper = document.querySelector('.conversation_info .group_options_wrapper')

        let show_menu_button = buttons_wrapper.querySelector('.toggle_group_menu')
        show_menu_button.addEventListener("click", this.#toggle_group_menu)

        let display_new_member_selection_button = 
            buttons_wrapper.querySelector('.add_user_to_group')
        const _self = this
        display_new_member_selection_button.addEventListener(
            "click", () => { _self.display_add_member_selection(room_uuid) }
        )

        let display_remove_member_selection_button =
            buttons_wrapper.querySelector('.remove_user')
        display_remove_member_selection_button.addEventListener(
            "click", () => { _self.display_remove_member_selection(room_uuid) }
        )
    }

    #set_add_member_selection_event_listeners(room_uuid) {
        let close_member_selection_button = this.container.querySelector(
            '.user_to_add_selection_wrapper .close_add_member_selection'
        )
        const _self = this
        close_member_selection_button.addEventListener(
            'click', () => { _self.close_add_member_selection() })

        let add_member_buttons = this.container.querySelectorAll(
            'button.member_to_add_option'
        )
        add_member_buttons.forEach(btn => {
            btn.addEventListener("click", (event) => {
                const member_id = event.currentTarget.getAttribute('member_id')
                _self.callbacks.add_member_to_group(member_id, room_uuid)
                _self.close_add_member_selection()
            })
        })
    }

    #set_remove_member_selection_event_listeners(room_uuid) {
        let close_member_selection_button = this.container.querySelector(
            '.user_to_remove_selection_wrapper .close_remove_member_selection'
        )
        const _self = this
        close_member_selection_button.addEventListener(
            'click', () => { _self.close_remove_member_selection() })

        let remove_member_buttons = this.container.querySelectorAll(
            'button.member_to_remove_option'
        )
        remove_member_buttons.forEach(btn => {
            btn.addEventListener("click", (event) => {
                const member_id = event.currentTarget.getAttribute('member_id')
                _self.callbacks.remove_member_from_group(member_id, room_uuid)
                _self.close_remove_member_selection()
            })
        })
    }

    show() {
        this.container.classList.remove("hidden_conversation_info");
    }
    hide() {
        this.container.classList.add("hidden_conversation_info");
    }
    is_shown() {
        return !(this.container.classList.contains("hidden_conversation_info"))
    }

    #set_img_avatar_or_thumb(avatar_uuid, name) {
        if (avatar_uuid && avatar_uuid != '') {
            const url_to_avatar_img = window.location.origin + "/files/" + avatar_uuid
            this.room_img.innerHTML = `<img src="${url_to_avatar_img}">`
        }
        else {
            this.room_img.innerHTML = `<div class="profile_photo_thumb">${name[0]}</div>`
        }
    }

    #remove_manage_group_button() {
        let manage_group_button = document.querySelector(
            '.conversation_info .group_options_wrapper'
        )
        if (manage_group_button) {
            manage_group_button.remove()
        }
    }

    #remove_add_member_selection_wrapper() {
        let add_member_selection = this.container.querySelector('.user_to_add_selection_wrapper')
        if (add_member_selection) {
            add_member_selection.remove()
        }
    }

    #show_initial_info_wrapper() {
        let initial_info = this.container.querySelector('.initial_info_wrapper')
        initial_info.classList.remove('hidden')
    }

    #hide_initial_info_wrapper() {
        let initial_info = this.container.querySelector('.initial_info_wrapper')
        initial_info.classList.add('hidden')
    }

    #display_private_chat_info(room_uuid) {
        const collocutor_id = Object.keys(this.rooms_data[room_uuid]['collocutors'])[0]
        const collocutor_data = this.rooms_data[room_uuid]['collocutors'][collocutor_id]

        this.room_name_html.innerText = collocutor_data['first_name']

        if (collocutor_data['is_online']) {
            this.room_meta.innerHTML = templates.profile_online_html()
        }
        else {
            const when_was_last_login = get_difference_between_now_and_date(collocutor_data['last_login'])
            this.room_meta.innerHTML = templates.profile_last_seen_html(when_was_last_login)
        }
        
        this.#set_img_avatar_or_thumb(collocutor_data['avatar_img_uuid'], 
                                      collocutor_data['first_name'])

        this.additional_info.innerHTML = ''

        const collocutor_username = collocutor_data['username']
        const username_html = templates.profile_username_html(collocutor_username)
        this.additional_info.innerHTML += username_html

        const collocutor_bio = collocutor_data['bio']
        if (collocutor_bio) {
            const bio_html = templates.profile_bio_html(collocutor_bio)
            this.additional_info.innerHTML += bio_html
        }

        // remove manage group button if it exists
        this.#remove_manage_group_button()
    }

    #display_group_info(room_uuid) {
        this.#remove_manage_group_button()

        // add class for scroll
        let conversation_info_wrapper_obj = 
        this.container.querySelector('.conversation_info_wrapper')

        conversation_info_wrapper_obj.classList.add('group_data')

        // set group name
        const group_data = this.rooms_data[room_uuid]['group_data']
        let group_name_el = this.container.querySelector('.profile_name')
        group_name_el.innerText = group_data['room_name']

        // set avatar or image thumb
        this.#set_img_avatar_or_thumb(group_data['avatar_uuid'], 
                                      group_data['room_name'])

        // set members count
        const group_members_dict = this.rooms_data[room_uuid]['collocutors']
        const members_count = Object.keys(group_members_dict).length + 1
        this.room_meta.innerHTML = templates.group_members_counter_html(members_count)

        // add members list
        const admin_id = group_data['admin_id']
        this.additional_info.innerHTML = templates.group_members_list_html(
            group_members_dict,
            admin_id,
            this.user_id,
            this.user_data
        )

        // if current user is admin 
        if (this.user_id == admin_id) {
            // add button for managing group
            const manage_group_button = templates.manage_group_button_html()
            this.container.insertAdjacentHTML('beforeend', manage_group_button)
            this.#set_manage_group_button_event_listeners(room_uuid)
        }
    }

    display_current_chat_info(room_uuid) {
        this.#remove_add_member_selection_wrapper()
        this.#show_initial_info_wrapper()

        if (this.rooms_data[room_uuid]['is_private']) {
            this.#display_private_chat_info(room_uuid)
        }
        else {
            this.#display_group_info(room_uuid)
        }
    }

    reload_room_online_info(room_uuid) {
        const room_data = this.rooms_data[room_uuid]
        if (room_data['is_private']) {
            const collocutor_id = Object.keys(room_data['collocutors'])[0]
            const collocutor_data = room_data['collocutors'][collocutor_id]
            
            if (collocutor_data['is_online']) {
                if (!this.room_meta.querySelector('.collocutor_online')) {
                    this.room_meta.innerHTML = templates.profile_online_html()
                }
            }
            else {
                if (this.room_meta.querySelector('.collocutor_online')) {
                    const when_was_last_login = get_difference_between_now_and_date(collocutor_data['last_login'])
                    this.room_meta.innerHTML = templates.profile_last_seen_html(when_was_last_login)
                }
            }
        }
    }

    display_add_member_selection(room_uuid) {
        const group_members_dict = this.rooms_data[room_uuid]['collocutors']
        const add_member_selection = templates.add_member_selection_html(
            this.rooms_data,
            group_members_dict
        )
        this.container.insertAdjacentHTML('beforeend', add_member_selection)

        this.#set_add_member_selection_event_listeners(room_uuid)

        this.#hide_initial_info_wrapper() 
        
        let show_manage_group_menu_button = this.container.querySelector(
            '.group_options_wrapper'
        )
        show_manage_group_menu_button.style.display = 'none'
    }

    close_add_member_selection() {
        this.container.querySelector(".user_to_add_selection_wrapper").remove()

        this.#show_initial_info_wrapper()

        let show_manage_group_menu_button = this.container.querySelector(
            '.group_options_wrapper'
        )
        show_manage_group_menu_button.style.display = 'block'
    }

    display_remove_member_selection(room_uuid) {
        const group_admin_id = this.rooms_data[room_uuid]['group_data']['admin_id']
        const group_members_dict = this.rooms_data[room_uuid]['collocutors']
        const remove_member_selection = templates.remove_member_selection_html(
            group_members_dict,
            group_admin_id
        )
        this.container.insertAdjacentHTML('beforeend', remove_member_selection)

        this.#set_remove_member_selection_event_listeners(room_uuid)

        this.#hide_initial_info_wrapper() 
        
        let show_manage_group_menu_button = this.container.querySelector(
            '.group_options_wrapper'
        )
        show_manage_group_menu_button.style.display = 'none'
    }

    close_remove_member_selection() {
        this.container.querySelector(".user_to_remove_selection_wrapper").remove()

        this.#show_initial_info_wrapper()

        let show_manage_group_menu_button = this.container.querySelector(
            '.group_options_wrapper'
        )
        show_manage_group_menu_button.style.display = 'block'
    }

    increment_group_members_counter() {
        let counter_element = this.room_meta.querySelector('.members_counter')
        const new_counter = Number(counter_element.textContent) + 1
        counter_element.textContent = new_counter
    }

    decrement_group_members_counter() {
        let counter_element = this.room_meta.querySelector('.members_counter')
        const new_counter = Number(counter_element.textContent) - 1
        counter_element.textContent = new_counter
    }

    add_member_to_list(room_uuid, new_member_id) {
        const member_data = this.rooms_data[room_uuid]['collocutors'][new_member_id]
        const is_member_admin = 
            this.rooms_data[room_uuid]['group_data']['admin_id'] == new_member_id
        const new_member_html = templates.group_member_html(
            member_data,
            is_member_admin,
            new_member_id
        )

        let members_list = this.container.querySelector('.group_members_list')
        members_list.insertAdjacentHTML('afterbegin', new_member_html)

        this.increment_group_members_counter()
    }

    remove_member_from_list(member_id) {
        let member_element = this.container.querySelector(
            `.group_members_list .group_member_data[member_id="${member_id}"]`
        )
        member_element.remove()

        this.decrement_group_members_counter()
    }
}