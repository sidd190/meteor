/**
 * Represents a single document in a SessionCollectionView
 * @class SessionDocumentView
 */
export class SessionDocumentView {
  public existsIn: Set<string>;
  public dataByKey: Map<string, Array<PrecedenceItem>>;
  public lastAccessed: number;

  constructor() {
    this.existsIn = new Set();
    this.dataByKey = new Map();
    this.lastAccessed = Date.now();
  }

  /**
   * Gets the current fields of the document
   */
  public getFields(): Record<string, any> {
    this.lastAccessed = Date.now();
    const fields: Record<string, any> = {};

    this.dataByKey.forEach((precedenceList, key) => {
      if (precedenceList.length > 0) {
        fields[key] = precedenceList[0].value;
      }
    });

    return fields;
  }

  /**
   * Clears a field from the document
   */
  public clearField(subscriptionHandle: string, key: string, changeCollector: Record<string, any>): void {
    if (key === '_id') return;

    const precedenceList = this.dataByKey.get(key);
    if (!precedenceList) return;

    let removedValue: any;
    for (let i = 0; i < precedenceList.length; i++) {
      if (precedenceList[i].subscriptionHandle === subscriptionHandle) {
        if (i === 0) {
          removedValue = precedenceList[i].value;
        }
        precedenceList.splice(i, 1);
        break;
      }
    }

    if (precedenceList.length === 0) {
      this.dataByKey.delete(key);
      changeCollector[key] = undefined;
    } else if (removedValue !== undefined &&
      !EJSON.equals(removedValue, precedenceList[0].value)) {
      changeCollector[key] = precedenceList[0].value;
    }
  }

  /**
   * Changes a field value in the document
   */
  public changeField(
    subscriptionHandle: string,
    key: string,
    value: any,
    changeCollector: Record<string, any>,
    isAdd: boolean = false
  ): void {
    if (key === '_id') return;

    value = EJSON.clone(value);

    if (!this.dataByKey.has(key)) {
      this.dataByKey.set(key, [{
        subscriptionHandle,
        value
      }]);
      changeCollector[key] = value;
      return;
    }

    const precedenceList = this.dataByKey.get(key)!;
    let item = !isAdd && precedenceList.find(
      p => p.subscriptionHandle === subscriptionHandle
    );

    if (item) {
      if (item === precedenceList[0] && !EJSON.equals(value, item.value)) {
        changeCollector[key] = value;
      }
      item.value = value;
    } else {
      precedenceList.push({ subscriptionHandle, value });
    }
  }
}

interface PrecedenceItem {
  subscriptionHandle: string;
  value: any;
}