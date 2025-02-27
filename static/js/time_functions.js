export function get_localized_date(date_str) {
    const send_date = new Date(date_str.replace(' ', 'T') + "Z");

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthNumber = send_date.getMonth();
    const monthWord = monthNames[monthNumber];
    const day = send_date.getDate();
    const year = send_date.getFullYear();
    
    const localized_date_str = `${monthWord} ${day}, ${year}`;

    return localized_date_str
}

export function get_short_localized_date(date_str) {
    const send_date = new Date(date_str.replace(' ', 'T') + "Z");

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nove", "Dec"
    ];
    const monthNumber = send_date.getMonth();
    const monthWord = monthNames[monthNumber];
    const day = send_date.getDate();
    const year = send_date.getFullYear();
    
    const localized_date_str = `${monthWord} ${day}, ${year}`;

    return localized_date_str
}

export function get_hours_minutes(date_str) {
    const send_date = new Date(date_str.replace(' ', 'T') + "Z");
    const hours = (send_date.getHours() < 10 ? "0" : "") + send_date.getHours()
    const minutes = (send_date.getMinutes() < 10 ? "0" : "") + send_date.getMinutes()
    const send_time = `${hours}:${minutes}`;
    
    return send_time
}

export function get_current_hours_minutes() {
    let currentdate = new Date();
    const hours_str = (currentdate.getHours() < 10 ? "0" : "") + currentdate.getHours()
    const minutes_str = (currentdate.getMinutes() < 10 ? "0" : "") + currentdate.getMinutes()
    const send_time = `${hours_str}:${minutes_str}`;

    return send_time
}

export function get_current_datetime() {
    let currentdate = new Date(); 
    let datetime = currentdate.getFullYear() + "-"
                + ((currentdate.getMonth() + 1 < 10 ? "0" : "")) + (currentdate.getMonth() + 1) + "-"
                + (currentdate.getDate() < 10 ? "0" : "") + currentdate.getDate()
                + " " 
                + (currentdate.getHours() < 10 ? "0" : "") + currentdate.getHours() + ":"  
                + (currentdate.getMinutes() < 10 ? "0" : "") + currentdate.getMinutes()
    return datetime
}

export function get_difference_between_now_and_date(date_str) {
    const date_now = new Date(); 
    const input_date =  new Date(date_str.replace(' ', 'T') + "Z");

    // get total seconds between the times
    var delta = Math.abs(date_now - input_date) / 1000;
    
    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;
    
    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;
    
    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    if (days == 1) {
        return `day ago`
    }
    else if (days > 1) {
        return `${days} days ago`
    }
    else if (hours == 1) {
        return `hour ago`
    }
    else if (hours > 1) {
        return `${hours} hours ago`
    }
    else if (minutes == 1) {
        return `just a minute ago`
    }
    else if (minutes > 1) {
        return `${minutes} minutes ago`
    }
    else {
        return `just now`
    }
}
