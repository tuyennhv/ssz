"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainerTreeViewDUClass = exports.ContainerNodeStructTreeViewDU = void 0;
const composite_1 = require("../type/composite");
const abstract_1 = require("./abstract");
/* eslint-disable @typescript-eslint/member-ordering */
class ContainerNodeStructTreeViewDU extends abstract_1.TreeViewDU {
    constructor(type, node) {
        super();
        this.type = type;
        this.valueChanged = null;
        this._rootNode = node;
    }
    get node() {
        return this._rootNode;
    }
    get cache() {
        return;
    }
    get value() {
        return this.valueChanged ?? this._rootNode.value;
    }
    /**
     * This ViewDU does not support batch hash by default so we need to compute root immediately.
     * Otherwise consumers may call commit() multiple times and not able to compute hashTreeRoot().
     */
    commit() {
        if (this.valueChanged === null) {
            this._rootNode.rootHashObject;
            return;
        }
        const value = this.valueChanged;
        this.valueChanged = null;
        this._rootNode = this.type.value_toTree(value);
        this._rootNode.rootHashObject;
    }
    /**
     * Same to commit() without hash, allow to do the batch hash at consumer side, like in ListValidatorViewDU
     * of ethereum consensus node.
     */
    commitNoHash() {
        if (this.valueChanged === null) {
            return;
        }
        const value = this.valueChanged;
        this.valueChanged = null;
        this._rootNode = this.type.value_toTree(value);
    }
    clearCache() {
        this.valueChanged = null;
    }
}
exports.ContainerNodeStructTreeViewDU = ContainerNodeStructTreeViewDU;
function getContainerTreeViewDUClass(type) {
    class CustomContainerTreeViewDU extends ContainerNodeStructTreeViewDU {
    }
    // Dynamically define prototype methods
    for (let index = 0; index < type.fieldsEntries.length; index++) {
        const { fieldName, fieldType } = type.fieldsEntries[index];
        // If the field type is basic, the value to get and set will be the actual 'struct' value (i.e. a JS number).
        // The view must use the tree_getFromNode() and tree_setToNode() methods to persist the struct data to the node,
        // and use the cached views array to store the new node.
        if (fieldType.isBasic) {
            Object.defineProperty(CustomContainerTreeViewDU.prototype, fieldName, {
                configurable: false,
                enumerable: true,
                // TODO: Review the memory cost of this closures
                get: function () {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return (this.valueChanged || this._rootNode.value)[fieldName];
                },
                set: function (value) {
                    if (this.valueChanged === null) {
                        this.valueChanged = this.type.clone(this._rootNode.value);
                    }
                    this.valueChanged[fieldName] = value;
                },
            });
        }
        // If the field type is composite, the value to get and set will be another TreeView. The parent TreeView must
        // cache the view itself to retain the caches of the child view. To set a value the view must return a node to
        // set it to the parent tree in the field gindex.
        else if (composite_1.isCompositeType(fieldType)) {
            Object.defineProperty(CustomContainerTreeViewDU.prototype, fieldName, {
                configurable: false,
                enumerable: true,
                // Returns TreeViewDU of fieldName
                get: function () {
                    const value = this.valueChanged || this._rootNode.value;
                    return fieldType.toViewDU(value[fieldName]);
                },
                // Expects TreeViewDU of fieldName
                set: function (view) {
                    if (this.valueChanged === null) {
                        this.valueChanged = this.type.clone(this._rootNode.value);
                    }
                    const value = fieldType.toValueFromViewDU(view);
                    this.valueChanged[fieldName] = value;
                },
            });
        }
        // Should never happen
        else {
            /* istanbul ignore next - unreachable code */
            throw Error(`Unknown fieldType ${fieldType.typeName} for fieldName ${fieldName}`);
        }
    }
    // Change class name
    Object.defineProperty(CustomContainerTreeViewDU, "name", { value: type.typeName, writable: false });
    return CustomContainerTreeViewDU;
}
exports.getContainerTreeViewDUClass = getContainerTreeViewDUClass;
//# sourceMappingURL=containerNodeStruct.js.map