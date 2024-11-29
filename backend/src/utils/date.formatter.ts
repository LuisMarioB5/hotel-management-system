import { format } from 'date-fns';

export class DateFormatter {
    static getSimpleDatetime(date: Date) {
        return format(date, 'dd/MM/yyyy hh:mm:ss a');
    }

    static getDatetime(date: Date) {
        return format(date, 'eeee, dd MM yyyy, hh:mm:ss a');
    }

    static getSimpleDate(date: Date) {
        return format(date, "dd/MM/yyyy");
    }
}