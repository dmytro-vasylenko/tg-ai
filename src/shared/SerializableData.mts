import fs from 'fs/promises';

export class SerializableData<T> {
  private name: string;

  private data: T;

  private DIRECTORY_PATH = 'data';

  constructor(name: string, defaultValue: T) {
    this.name = name;
    this.data = defaultValue;

    this.load();
  }

  get filePath() {
    return `${this.DIRECTORY_PATH}/${this.name}`;
  }

  setValue(setter: (data: T) => T) {
    this.data = setter(this.data);

    this.save();
  }

  getValue() {
    return this.data;
  }

  async load() {
    try {
      const input = await fs.readFile(this.filePath);

      this.data = JSON.parse(input.toString()) as T;

      console.log(`${this.name}: loaded`);
    } catch {
      console.log(`${this.name}: empty`);
    }
  }

  async save() {
    const output = JSON.stringify(this.data, null, 2);

    try {
      await fs.access(this.DIRECTORY_PATH);
    } catch {
      await fs.mkdir(this.DIRECTORY_PATH, { recursive: true });
    }

    fs.writeFile(this.filePath, output);
  }
}