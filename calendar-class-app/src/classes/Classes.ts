export class Classes {
    private classList: { id: number; name: string; date: string; time: string; }[] = [];
    private nextId: number = 1;

    createClass(name: string, date: string, time: string): { id: number; name: string; date: string; time: string; } {
        const newClass = { id: this.nextId++, name, date, time };
        this.classList.push(newClass);
        return newClass;
    }

    updateClass(id: number, name?: string, date?: string, time?: string): boolean {
        const classToUpdate = this.classList.find(cls => cls.id === id);
        if (!classToUpdate) return false;

        if (name) classToUpdate.name = name;
        if (date) classToUpdate.date = date;
        if (time) classToUpdate.time = time;

        return true;
    }

    deleteClass(id: number): boolean {
        const index = this.classList.findIndex(cls => cls.id === id);
        if (index === -1) return false;

        this.classList.splice(index, 1);
        return true;
    }

    getAllClasses(): { id: number; name: string; date: string; time: string; }[] {
        return this.classList;
    }
}