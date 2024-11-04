import { SessionDocumentView } from './session_document_view';
import { LRUMap } from 'lru_map'
import isEmpty from 'lodash.isempty';

/**
 * Represents a client's view of documents within a single collection
 * @class SessionCollectionView
 */
export class SessionCollectionView {
  private readonly collectionName: string;
  private readonly callbacks: SessionCallbacks;
  private readonly documents: LRUMap<string, SessionDocumentView>;
  private readonly options: ViewOptions;

  /**
   * @param collectionName - Name of the collection this view represents
   * @param callbacks - Callbacks for document changes (added/changed/removed)
   * @param options - Configuration options for the view
   */
  constructor(
    collectionName: string,
    callbacks: SessionCallbacks,
    options: ViewOptions = {}
  ) {
    this.collectionName = collectionName;
    this.callbacks = callbacks;
    this.options = {
      maxDocuments: options.maxDocuments || 10000,
      documentTTL: options.documentTTL || 3600000, // 1 hour in ms
      cleanupInterval: options.cleanupInterval || 300000 // 5 minutes in ms
    };

    // Use LRU cache with max size limit
    this.documents = new LRUMap<string, SessionDocumentView>(this.options.maxDocuments);

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Periodically removes stale documents and frees memory
   * @private
   */
  private startCleanup(): void {
    const cleanup = (): void => {
      const now = Date.now();
      this.documents.forEach((doc, id) => {
        if (now - doc.lastAccessed > this.options.documentTTL) {
          this.documents.delete(id);
        }
      });
    };

    if (typeof setInterval !== 'undefined') {
      setInterval(cleanup, this.options.cleanupInterval);
    }
  }

  /**
   * Checks if the view is empty
   */
  public isEmpty(): boolean {
    return this.documents.size === 0;
  }

  /**
   * Adds or updates a document in the view
   */
  public added(subscriptionHandle: string, id: string, fields: Record<string, any>): void {
    let docView = this.documents.get(id);
    const added = !docView;

    if (!docView) {
      docView = new SessionDocumentView();
      this.documents.set(id, docView);
    }

    docView.existsIn.add(subscriptionHandle);
    const changeCollector: Record<string, any> = {};

    Object.entries(fields).forEach(([key, value]) => {
      docView.changeField(subscriptionHandle, key, value, changeCollector, true);
    });

    if (added) {
      this.callbacks.added(this.collectionName, id, changeCollector);
    } else {
      this.callbacks.changed(this.collectionName, id, changeCollector);
    }
  }

  /**
   * Updates an existing document in the view
   */
  public changed(subscriptionHandle: string, id: string, changed: Record<string, any>): void {
    const docView = this.documents.get(id);
    if (!docView) {
      throw new Error(`Changed called on document ${id} that does not exist`);
    }

    const changedResult: Record<string, any> = {};
    Object.entries(changed).forEach(([key, value]) => {
      if (value === undefined) {
        docView.clearField(subscriptionHandle, key, changedResult);
      } else {
        docView.changeField(subscriptionHandle, key, value, changedResult);
      }
    });

    if (!isEmpty(changedResult)) {
      this.callbacks.changed(this.collectionName, id, changedResult);
    }
  }

  /**
   * Removes a document from the view
   */
  public removed(subscriptionHandle: string, id: string): void {
    const docView = this.documents.get(id);
    if (!docView) {
      throw new Error(`Removed called on document ${id} that does not exist`);
    }

    docView.existsIn.delete(subscriptionHandle);

    if (docView.existsIn.size === 0) {
      this.documents.delete(id);
      this.callbacks.removed(this.collectionName, id);
    } else {
      const changed: Record<string, any> = {};
      docView.dataByKey.forEach((precedenceList, key) => {
        docView.clearField(subscriptionHandle, key, changed);
      });

      if (!isEmpty(changed)) {
        this.callbacks.changed(this.collectionName, id, changed);
      }
    }
  }

  /**
   * Compares this view with another and sends appropriate callbacks
   */
  public diff(previous: SessionCollectionView): void {
    DiffSequence.diffMaps(previous.documents, this.documents, {
      both: (id, prevDocView, newDocView) => {
        this.diffDocument(id, prevDocView, newDocView);
      },
      rightOnly: (id, newDocView) => {
        this.callbacks.added(this.collectionName, id, newDocView.getFields());
      },
      leftOnly: (id) => {
        this.callbacks.removed(this.collectionName, id);
      }
    });
  }

  /**
   * Cleans up resources used by this view
   */
  public destroy(): void {
    this.documents.clear();
  }

  /**
   * @private
   */
  private diffDocument(id: string, prevDocView: SessionDocumentView, newDocView: SessionDocumentView): void {
    const fields: Record<string, any> = {};
    DiffSequence.diffObjects(prevDocView.getFields(), newDocView.getFields(), {
      both: (key, prev, now) => {
        if (!EJSON.equals(prev, now)) {
          fields[key] = now;
        }
      },
      rightOnly: (key, now) => {
        fields[key] = now;
      },
      leftOnly: (key) => {
        fields[key] = undefined;
      }
    });

    if (!isEmpty(fields)) {
      this.callbacks.changed(this.collectionName, id, fields);
    }
  }
}

interface ViewOptions {
  maxDocuments?: number;
  documentTTL?: number;
  cleanupInterval?: number;
}

interface SessionCallbacks {
  added: (collection: string, id: string, fields: Record<string, any>) => void;
  changed: (collection: string, id: string, fields: Record<string, any>) => void;
  removed: (collection: string, id: string) => void;
}