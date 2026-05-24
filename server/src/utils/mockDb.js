const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'db.json');

class MockQuery {
  constructor(executeFn) {
    this.executeFn = executeFn;
    const chainMethods = ['sort', 'skip', 'limit', 'select', 'populate', 'session'];
    chainMethods.forEach(method => {
      this[method] = function() {
        return this; // chainable
      };
    });
  }

  then(resolve, reject) {
    try {
      const res = this.executeFn();
      if (res && typeof res.then === 'function') {
        return res.then(resolve, reject);
      }
      if (resolve) {
        resolve(res);
      }
      return Promise.resolve(res);
    } catch (err) {
      if (reject) {
        reject(err);
      }
      return Promise.reject(err);
    }
  }

  catch(reject) {
    return this.then(null, reject);
  }
}

function enableMockDb() {
  console.log('[MockDB] 🚀 Initializing In-Memory Mock Database with File Persistence (db.json)...');
  
  let mockStore = {
    bookings: [],
    donations: [],
    tokens: [],
    rooms: [
      {
        _id: '664fa1e2e1b2c3d4e5f6a701',
        name: "Ganga View Deluxe Room",
        capacity: 3,
        pricePerNight: 2500,
        gstRate: 0.12,
        isActive: true,
        description: "Beautiful room with a direct view of the sacred Ganga Sangam.",
        blockedDates: []
      },
      {
        _id: '664fa1e2e1b2c3d4e5f6a702',
        name: "Sangam Standard Room",
        capacity: 2,
        pricePerNight: 1500,
        gstRate: 0.12,
        isActive: true,
        description: "Comfortable standard room close to the temple ghats.",
        blockedDates: []
      },
      {
        _id: '664fa1e2e1b2c3d4e5f6a703',
        name: "Family Pilgrim Suite",
        capacity: 6,
        pricePerNight: 4000,
        gstRate: 0.12,
        isActive: true,
        description: "Spacious suite designed for families and group pilgrims.",
        blockedDates: []
      }
    ],
    admins: [
      {
        _id: '664fa1e2e1b2c3d4e5f6a700',
        email: "owner@dharamshala.com",
        passwordHash: "$2a$10$UADusqCXtqSlMKDF3ZKYuueHqDyRKXxW7asc0I8zc57ES.br2hc4m" // password: Password@rudrprayad
      }
    ]
  };

  // Helper to save store to local JSON file
  const saveStore = () => {
    try {
      const serializable = {};
      for (let k in mockStore) {
        serializable[k] = mockStore[k].map(item => {
          const copy = { ...item };
          const helpers = ['save', 'toObject', 'sort', 'skip', 'limit', 'select', 'populate', 'session'];
          helpers.forEach(h => delete copy[h]);
          return copy;
        });
      }
      fs.writeFileSync(dbPath, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (err) {
      console.error('[MockDB] ❌ Failed to save persistent data to db.json:', err.message);
    }
  };

  // Helper to load store from local JSON file
  const loadStore = () => {
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf-8');
        if (fileContent.trim()) {
          const parsed = JSON.parse(fileContent);
          mockStore = {
            bookings: parsed.bookings || [],
            donations: parsed.donations || [],
            tokens: parsed.tokens || [],
            rooms: parsed.rooms || mockStore.rooms,
            admins: parsed.admins || mockStore.admins
          };
          console.log('[MockDB] ✅ Loaded persistent database state from server/db.json');
        }
      } else {
        saveStore(); // Create the initial file with seed rooms
      }
    } catch (err) {
      console.warn('[MockDB] ⚠️ Failed to load db.json, running with initial seed state:', err.message);
    }
  };

  // Run the load immediately on initialization
  loadStore();

  const getStoreKey = (modelName) => {
    if (modelName === 'Booking') return 'bookings';
    if (modelName === 'Donation') return 'donations';
    if (modelName === 'Token') return 'tokens';
    if (modelName === 'RoomType') return 'rooms';
    if (modelName === 'Admin') return 'admins';
    return null;
  };

  // Mock mongoose.startSession globally
  mongoose.startSession = async function() {
    return {
      startTransaction: () => {},
      commitTransaction: async () => {},
      abortTransaction: async () => {},
      endSession: () => {}
    };
  };

  const patchModel = (Model) => {
    const key = getStoreKey(Model.modelName);
    if (!key) return;

    console.log(`[MockDB]   Mocking Mongoose Model: ${Model.modelName}`);

    const generateId = () => new mongoose.Types.ObjectId().toString();

    const wrapDoc = (item) => {
      if (!item) return null;
      if (item.save && typeof item.save === 'function') return item;

      const wrapped = { ...item };

      wrapped.save = async function() {
        const idx = mockStore[key].findIndex(x => x._id.toString() === this._id.toString());
        if (idx !== -1) {
          mockStore[key][idx] = { ...this, updatedAt: new Date() };
        } else {
          mockStore[key].push(this);
        }
        saveStore(); // Persist changes
        return this;
      };

      wrapped.toObject = function() {
        const copy = { ...this };
        delete copy.save;
        delete copy.toObject;
        return copy;
      };

      // Add chain methods on individual docs just in case
      const chainMethods = ['sort', 'skip', 'limit', 'select', 'populate', 'session'];
      chainMethods.forEach(method => {
        wrapped[method] = function() { return this; };
      });

      return wrapped;
    };

    const findInternal = (filter = {}) => {
      let results = [...mockStore[key]];
      if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
        results = results.filter(item => {
          for (let k in filter) {
            if (k === '$or' && Array.isArray(filter[k])) {
              return filter[k].some(subFilter => {
                for (let sk in subFilter) {
                  const val = item[sk];
                  const filterVal = subFilter[sk];
                  if (filterVal instanceof RegExp) {
                    if (val === undefined || val === null) return false;
                    if (!filterVal.test(val)) return false;
                  } else if (val !== filterVal && String(val) !== String(filterVal)) {
                    return false;
                  }
                }
                return true;
              });
            }
            const val = item[k];
            const filterVal = filter[k];
            if (filterVal instanceof RegExp) {
              if (val === undefined || val === null) return false;
              if (!filterVal.test(val)) return false;
            } else if (filterVal && typeof filterVal === 'object') {
              for (let op in filterVal) {
                if (op === '$gte' && new Date(val) < new Date(filterVal[op])) return false;
                if (op === '$lte' && new Date(val) > new Date(filterVal[op])) return false;
                if (op === '$gt' && new Date(val) <= new Date(filterVal[op])) return false;
                if (op === '$lt' && new Date(val) >= new Date(filterVal[op])) return false;
              }
            } else if (val !== filterVal && String(val) !== String(filterVal)) {
              return false;
            }
          }
          return true;
        });
      }
      return results.map(wrapDoc);
    };

    // 1. Model.create
    Model.create = async function(docs, options) {
      const arr = Array.isArray(docs) ? docs : [docs];
      const created = arr.map(doc => {
        const docObj = doc.toObject ? doc.toObject() : doc;
        const item = { ...docObj };
        
        if (!item._id) item._id = generateId();
        if (!item.createdAt) item.createdAt = new Date();
        if (!item.updatedAt) item.updatedAt = new Date();
        
        const wrapped = wrapDoc(item);
        mockStore[key].push(wrapped);
        return wrapped;
      });
      saveStore(); // Persist changes
      return Array.isArray(docs) ? created : created[0];
    };

    // 2. Model.find
    Model.find = function(filter = {}) {
      return new MockQuery(() => findInternal(filter));
    };

    // 3. Model.findOne
    Model.findOne = function(filter = {}) {
      return new MockQuery(() => {
        const results = findInternal(filter);
        return results.length > 0 ? results[0] : null;
      });
    };

    // 4. Model.findById
    Model.findById = function(id) {
      return Model.findOne({ _id: id });
    };

    // 5. Model.countDocuments
    Model.countDocuments = function(filter = {}) {
      return new MockQuery(() => findInternal(filter).length);
    };

    // 6. Model.findOneAndUpdate
    Model.findOneAndUpdate = function(filter, update, options) {
      return new MockQuery(async () => {
        const results = findInternal(filter);
        const doc = results.length > 0 ? results[0] : null;
        if (doc) {
          const updateFields = update.$set || update;
          for (let k in updateFields) {
            doc[k] = updateFields[k];
          }
          await doc.save(); // This implicitly calls saveStore()
        }
        return doc;
      });
    };

    // 7. Model.findByIdAndUpdate
    Model.findByIdAndUpdate = function(id, update, options) {
      return Model.findOneAndUpdate({ _id: id }, update, options);
    };

    // 8. Model.aggregate
    Model.aggregate = async function(pipeline = []) {
      let results = [...mockStore[key]];
      
      for (const stage of pipeline) {
        if (stage.$match) {
          const match = stage.$match;
          results = results.filter(item => {
            for (let k in match) {
              if (item[k] !== match[k] && String(item[k]) !== String(match[k])) return false;
            }
            return true;
          });
        }
        if (stage.$group) {
          const group = stage.$group;
          const groupRes = { _id: null };
          for (let k in group) {
            if (k === '_id') continue;
            const op = group[k];
            if (op.$sum) {
              if (op.$sum === 1) {
                groupRes[k] = results.length;
              } else if (typeof op.$sum === 'string' && op.$sum.startsWith('$')) {
                const path = op.$sum.slice(1);
                const getVal = (obj, p) => p.split('.').reduce((o, i) => (o ? o[i] : null), obj);
                groupRes[k] = results.reduce((acc, curr) => {
                  const val = Number(getVal(curr, path)) || 0;
                  return acc + val;
                }, 0);
              }
            }
          }
          return [groupRes];
        }
      }
      return results;
    };

    // Override prototype methods for class instantiations
    Model.prototype.save = async function() {
      const item = this.toObject ? this.toObject() : this;
      const plain = {};
      for (let k in item) {
        if (typeof item[k] !== 'function' && k !== '$__') {
          plain[k] = item[k];
        }
      }

      if (!plain._id) plain._id = generateId();
      if (!plain.createdAt) plain.createdAt = new Date();
      plain.updatedAt = new Date();

      const idx = mockStore[key].findIndex(x => x._id.toString() === plain._id.toString());
      if (idx !== -1) {
        mockStore[key][idx] = { ...mockStore[key][idx], ...plain };
      } else {
        mockStore[key].push(plain);
      }
      
      Object.assign(this, plain);
      wrapDoc(this); // apply wrap properties
      saveStore(); // Persist changes
      return this;
    };
  };

  // Patch all currently registered models
  mongoose.modelNames().forEach(name => {
    patchModel(mongoose.model(name));
  });

  // Patch all future models
  const originalModel = mongoose.model.bind(mongoose);
  mongoose.model = function(name, schema) {
    const Model = originalModel(name, schema);
    patchModel(Model);
    return Model;
  };
}

module.exports = { enableMockDb };
