import type {
    ImportDefaultSpecifier,
    ImportNamespaceSpecifier,
    ImportSpecifier
} from "estree";

/**
 * An ImportSpecifier, ImportDefaultSpecifier, or ImportNamespaceSpecifier
 * This is distinct from BaseModuleSpecifier because it excludes ExportSpecifier
 */
export type GenericImportSpecifier = ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier;
