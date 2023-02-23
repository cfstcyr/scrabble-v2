export class Random {
    static getRandomElementsFromArray<T>(array: T[], elementsToChoose: number = 1): T[] {
        if (elementsToChoose > array.length) return array;

        let length = array.length;
        const result = new Array(elementsToChoose);
        const taken = new Array(length);

        while (elementsToChoose--) {
            const randomIndex = Math.floor(Math.random() * length);

            result[elementsToChoose] = array[randomIndex in taken ? taken[randomIndex] : randomIndex];
            taken[randomIndex] = --length in taken ? taken[length] : length;
        }
        return result;
    }

    static popRandom<T>(array: T[]): T | undefined {
        return array.splice(Math.floor(Math.random() * array.length), 1).pop();
    }

    static randomIntFromInterval(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
