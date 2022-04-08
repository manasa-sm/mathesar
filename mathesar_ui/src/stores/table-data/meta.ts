import {
  ImmutableMap,
  WritableMap,
  ImmutableSet,
} from '@mathesar-component-library';
import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { TerseFiltering } from './filtering';
import { Filtering } from './filtering';
import type { TerseSorting } from './sorting';
import { Sorting } from './sorting';
import type { TersePagination } from './pagination';
import { Pagination } from './pagination';
import type { TerseGrouping } from './grouping';
import { Grouping } from './grouping';
import type { RecordsRequestParamsData } from './records';

// export const RECORD_COMBINED_STATE_KEY = '__combined';

// export type UpdateModificationType = 'updating' | 'updated' | 'updateFailed';

// export type ModificationType =
//   | 'creating'
//   | 'created'
//   | 'creationFailed'
//   | UpdateModificationType
//   | 'deleting'
//   | 'deleteFailed';

// export type ModificationStatus = 'inProcess' | 'complete' | 'error' | 'idle';

// /**
//  * The outer Map keys are "recordKey" values. For normal records, these are the
//  * values of the primary key column. For new records, they are the row
//  * identifiers, e.g. "__0_new_0".
//  *
//  * The inner Map keys are "cellKey" values.
//  */
// export type ModificationStateMap = Map<unknown, Map<unknown, ModificationType>>;

// const inProgressSet: Set<ModificationType> = new Set([
//   'creating',
//   'updating',
//   'deleting',
// ]);
// const completeSet: Set<ModificationType> = new Set(['created', 'updated']);
// const errorSet: Set<ModificationType> = new Set([
//   'creationFailed',
//   'updateFailed',
//   'deleteFailed',
// ]);

// export function getGenericModificationStatusByPK(
//   recordModificationState: ModificationStateMap,
//   primaryKeyValue: unknown,
// ): ModificationStatus {
//   const type = recordModificationState
//     .get(primaryKeyValue)
//     ?.get(RECORD_COMBINED_STATE_KEY);
//   if (!type) {
//     return 'idle';
//   }
//   if (inProgressSet.has(type)) {
//     return 'inProcess';
//   }
//   if (completeSet.has(type)) {
//     return 'complete';
//   }
//   if (errorSet.has(type)) {
//     return 'error';
//   }
//   return 'idle';
// }

// function getCombinedUpdateState(
//   cellMap: Map<unknown, ModificationType>,
// ): UpdateModificationType {
//   let state: UpdateModificationType = 'updated';
//   // eslint-disable-next-line no-restricted-syntax
//   for (const [key, value] of cellMap) {
//     if (key !== RECORD_COMBINED_STATE_KEY) {
//       if (value === 'updating') {
//         state = 'updating';
//         break;
//       } else if (value === 'updateFailed') {
//         state = 'updateFailed';
//         break;
//       }
//     }
//   }
//   return state;
// }

// function getCombinedModificationState(
//   recordModificationState: Readable<ModificationStateMap>,
// ) {
//   return derived(
//     recordModificationState,
//     ($recordModificationState, set) => {
//       if ($recordModificationState.size === 0) {
//         set('idle');
//       } else {
//         let finalState: ModificationStatus = 'idle';
//         // eslint-disable-next-line no-restricted-syntax
//         for (const value of $recordModificationState.values()) {
//           const rowState = value?.get(RECORD_COMBINED_STATE_KEY);
//           if (rowState) {
//             if (inProgressSet.has(rowState)) {
//               finalState = 'inProcess';
//               break;
//             }
//             if (errorSet.has(rowState)) {
//               finalState = 'error';
//             } else if (completeSet.has(rowState) && finalState === 'idle') {
//               finalState = 'complete';
//             }
//           }
//         }
//         set(finalState);
//       }
//     },
//     'idle' as ModificationStatus,
//   );
// }

// =============================================================================

export type RequestStatus =
  | { state: 'processing' }
  | { state: 'success' }
  | { state: 'failure'; errors: string[] };

// interface CellStatusReport {
//   clientSideErrors: Writable<string[]>;
//   modificationStatus: Writable<RequestStatus | undefined>;
// }

// interface RowStatusReport {
//   deletionStatus: Writable<RequestStatus | undefined>;
//   creationStatus: Writable<RequestStatus | undefined>;
//   hasModificationFailures: Readable<boolean>;
// }

export type CellKey = string;
export type RowKey = string;

const CELL_KEY_SEPARATOR = '::';

function getCellKey(rowKey: RowKey, columnId: string): CellKey {
  return `${String(rowKey)}${CELL_KEY_SEPARATOR}${columnId}`;
}

function extractRowKeyFromCellKey(cellKey: CellKey): RowKey {
  return cellKey
    .split(CELL_KEY_SEPARATOR)
    .slice(0, -1)
    .join(CELL_KEY_SEPARATOR);
}

/**
 * Unlike in `RequestStatus`, here the state and the error messages are
 * disentangled. That's because it's possible to have a `wholeRowState` of
 * `'success'` (if the row has been added) and still have error messages to
 * display (if the user has attempted to update a _cell_ within the row, but
 * that update has failed.)
 */
interface RowStatus {
  /**
   * The combined state of the most recent "creation" or "deletion" request. We
   * use this to set the background color for all cells and the row header.
   */
  wholeRowState?: RequestStatus['state'];

  /**
   * The triangle error popover indicator will display whenever this array
   * contains errors -- even if `wholeRowState` is `'success'`.
   */
  errorsFromWholeRowAndCells: string[];
}

function getRowStatus({
  cellModificationStatus,
  rowDeletionStatus,
  rowCreationStatus,
}: {
  rowCreationStatus: ImmutableMap<RowKey, RequestStatus>;
  rowDeletionStatus: ImmutableMap<RowKey, RequestStatus>;
  cellModificationStatus: ImmutableMap<CellKey, RequestStatus>;
}): ImmutableMap<RowKey, RowStatus> {
  type PartialResult = ImmutableMap<RowKey, Partial<RowStatus>>;

  const keysOfRowsWithCellErrors = [...cellModificationStatus].reduce(
    (rows, [cellKey, cellStatus]) =>
      cellStatus.state === 'failure'
        ? rows.with(extractRowKeyFromCellKey(cellKey))
        : rows,
    new ImmutableSet<RowKey>(),
  );
  const msg = 'This row contains a cell with an error.';
  const statusFromCells: PartialResult = new ImmutableMap(
    [...keysOfRowsWithCellErrors].map((rowKey) => [
      rowKey,
      { errorsFromWholeRowAndCells: [msg] },
    ]),
  );

  const statusFromCreationAndDeletion: PartialResult = rowCreationStatus
    .withEntries(rowDeletionStatus)
    .mapValues((requestStatus) => ({ wholeRowState: requestStatus.state }));

  function mergeStatuses(a: Partial<RowStatus>, b: Partial<RowStatus>) {
    return { ...a, ...b };
  }

  function makeStatusComplete(partialStatus: Partial<RowStatus>): RowStatus {
    return {
      errorsFromWholeRowAndCells: [],
      ...partialStatus,
    };
  }

  return statusFromCells
    .withEntries(statusFromCreationAndDeletion, mergeStatuses)
    .mapValues(makeStatusComplete);
}

// =============================================================================

export interface MetaProps {
  pagination: Pagination;
  sorting: Sorting;
  grouping: Grouping;
  filtering: Filtering;
}

/** Adds default values. */
function getFullMetaProps(p?: Partial<MetaProps>): MetaProps {
  return {
    pagination: p?.pagination ?? new Pagination(),
    sorting: p?.sorting ?? new Sorting(),
    grouping: p?.grouping ?? new Grouping(),
    filtering: p?.filtering ?? new Filtering(),
  };
}

export type TerseMetaProps = [
  TersePagination,
  TerseSorting,
  TerseGrouping,
  TerseFiltering,
];

export function makeMetaProps(t: TerseMetaProps): MetaProps {
  return {
    pagination: Pagination.fromTerse(t[0]),
    sorting: Sorting.fromTerse(t[1]),
    grouping: Grouping.fromTerse(t[2]),
    filtering: Filtering.fromTerse(t[3]),
  };
}

export function makeTerseMetaProps(p?: Partial<MetaProps>): TerseMetaProps {
  const props = getFullMetaProps(p);
  return [
    props.pagination.terse(),
    props.sorting.terse(),
    props.grouping.terse(),
    props.filtering.terse(),
  ];
}

/**
 * The Meta store is meant to be used by other stores for storing and operating
 * on meta information. This may also include display properties. Properties in
 * Meta store do not depend on other stores. For display specific properties
 * that depend on other stores, the Display store can be used.
 */
export class Meta {
  pagination: Writable<Pagination>;

  sorting: Writable<Sorting>;

  grouping: Writable<Grouping>;

  filtering: Writable<Filtering>;

  selectedRecords: Writable<Set<unknown>>;

  // Row -> Cell -> Type
  // recordModificationState: Writable<ModificationStateMap>; // TODO_SC remove

  // combinedModificationState: Readable<ModificationStatus>; // TODO_SC remove

  cellClientSideErrors = new WritableMap<CellKey, string[]>();

  /**
   * For each cell, the status of the most recent request to update the cell. If
   * no request has been made, then no entry will be present in the map.
   */
  cellModificationStatus = new WritableMap<CellKey, RequestStatus>();

  /**
   * For each row, the status of the most recent request to delete the row. If
   * no request has been made, then no entry will be present in the map.
   */
  rowDeletionStatus = new WritableMap<RowKey, RequestStatus>();

  /**
   * For each newly added row, the status of the most recent request to add
   * the row. If no request has been made, then no entry will be present in the
   * map. Rows that are not newly added rows will never have entries here.
   */
  rowCreationStatus = new WritableMap<RowKey, RequestStatus>();

  rowStatus: Readable<ImmutableMap<RowKey, RowStatus>>;

  /**
   * Allows us to save and re-create Meta, e.g. from data stored in the tab
   * system.
   */
  props: Readable<MetaProps>;

  /**
   * Allows us to re-fetch records from the server when some of the parameters
   * change.
   */
  recordsRequestParamsData: Readable<RecordsRequestParamsData>;

  constructor(p?: Partial<MetaProps>) {
    const props = getFullMetaProps(p);
    this.pagination = writable(props.pagination);
    this.sorting = writable(props.sorting);
    this.grouping = writable(props.grouping);
    this.filtering = writable(props.filtering);

    this.selectedRecords = writable(new Set());
    // this.recordModificationState = writable(new Map() as ModificationStateMap);

    // this.combinedModificationState = getCombinedModificationState(
    //   this.recordModificationState,
    // );

    this.rowStatus = derived(
      [
        this.cellModificationStatus,
        this.rowDeletionStatus,
        this.rowCreationStatus,
      ],
      ([cellModificationStatus, rowDeletionStatus, rowCreationStatus]) =>
        getRowStatus({
          cellModificationStatus,
          rowDeletionStatus,
          rowCreationStatus,
        }),
    );

    // Why do `this.props` and `this.recordsRequestParamsData` look identical?
    //
    // It's a coincidence that `MetaProps` and `RecordsRequestParamsData` are
    // almost identical, but that might not always be the case. For example, if
    // we want to store info in the tabs system about the selected cells, then
    // `MetaProps` would need more fields. Using separate fields for
    // `this.props` and `this.recordsRequestParamsData` gives us a separation
    // of concerns.
    this.props = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
    this.recordsRequestParamsData = derived(
      [this.pagination, this.sorting, this.grouping, this.filtering],
      ([pagination, sorting, grouping, filtering]) => ({
        pagination,
        sorting,
        grouping,
        filtering,
      }),
    );
  }

  clearSelectedRecords(): void {
    this.selectedRecords.set(new Set());
  }

  selectRecordByPrimaryKey(primaryKeyValue: unknown): void {
    if (!get(this.selectedRecords).has(primaryKeyValue)) {
      this.selectedRecords.update((existingSet) => {
        const newSet = new Set(existingSet);
        newSet.add(primaryKeyValue);
        return newSet;
      });
    }
  }

  deSelectRecordByPrimaryKey(primaryKeyValue: unknown): void {
    if (get(this.selectedRecords).has(primaryKeyValue)) {
      this.selectedRecords.update((existingSet) => {
        const newSet = new Set(existingSet);
        newSet.delete(primaryKeyValue);
        return newSet;
      });
    }
  }

  // =============================================================================

  // setRecordModificationState(key: unknown, state: ModificationType): void {
  //   this.recordModificationState.update((existingMap) => {
  //     const newMap = new Map(existingMap);
  //     let cellMap = newMap.get(key);
  //     if (!cellMap) {
  //       cellMap = new Map();
  //       newMap.set(key, cellMap);
  //     }
  //     cellMap.set(RECORD_COMBINED_STATE_KEY, state);
  //     return newMap;
  //   });
  // }

  // clearRecordModificationState(key: unknown): void {
  //   this.recordModificationState.update((existingMap) => {
  //     const newMap = new Map(existingMap);
  //     newMap.delete(key);
  //     return newMap;
  //   });
  // }

  // clearAllRecordModificationStates(): void {
  //   this.recordModificationState.set(new Map());
  // }

  // setCellUpdateState(
  //   recordKey: unknown,
  //   cellKey: unknown,
  //   state: UpdateModificationType,
  // ): void {
  //   this.recordModificationState.update((existingMap) => {
  //     const newMap = new Map(existingMap);
  //     let cellMap = newMap.get(recordKey);
  //     if (!cellMap) {
  //       cellMap = new Map();
  //       newMap.set(recordKey, cellMap);
  //     }
  //     cellMap.set(cellKey, state);
  //     cellMap.set(RECORD_COMBINED_STATE_KEY, getCombinedUpdateState(cellMap));
  //     return newMap;
  //   });
  // }

  // setMultipleRecordModificationStates(
  //   keys: unknown[],
  //   state: ModificationType,
  // ): void {
  //   this.recordModificationState.update((existingMap) => {
  //     const newMap = new Map(existingMap);
  //     keys.forEach((rowKey) => {
  //       let cellMap = newMap.get(rowKey);
  //       if (!cellMap) {
  //         cellMap = new Map();
  //         newMap.set(rowKey, cellMap);
  //       }
  //       cellMap.set(RECORD_COMBINED_STATE_KEY, state);
  //     });
  //     return newMap;
  //   });
  // }

  // clearMultipleRecordModificationStates(keys: unknown[]): void {
  //   this.recordModificationState.update((existingMap) => {
  //     const newMap = new Map(existingMap);
  //     keys.forEach((value) => {
  //       newMap.delete(value);
  //     });
  //     return newMap;
  //   });
  // }
}
