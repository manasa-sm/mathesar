<script lang="ts">
  import { Icon, Button } from '@mathesar-component-library';
  import { iconTrash } from '@mathesar/icons';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import type {
    Constraint,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import { getContext } from 'svelte';

  export let constraint: Constraint;
  export let drop: () => Promise<void>;

  const tabularData = getContext<TabularDataStore>('tabularData');

  function handleDrop() {
    void confirmDelete({
      identifierType: 'Constraint',
      identifierName: constraint.name,
      body: ['Are you sure you want to proceed?'],
      onProceed: drop,
    });
  }

  $: dropTitle = `Delete constraint '${constraint.name}'`;
  $: columns = $tabularData.columnsDataStore.getColumnsByIds(
    constraint.columns,
  );
  $: columnNames = columns.map((columnInConstraint) => columnInConstraint.name);
  $: columnSummary = columnNames.join(', ');
</script>

<div class="table-constraint">
  <div>
    <div><span class="name">{constraint.name}</span></div>
    <div>
      <span class="type">{constraint.type}</span>
      <span>&bull;</span>
      <span class="columns">{columnSummary}</span>
    </div>
  </div>
  <div class="drop">
    <Button on:click={handleDrop} title={dropTitle}>
      <Icon {...iconTrash} />
    </Button>
  </div>
</div>

<style>
  .table-constraint {
    line-height: 1.4;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .type {
    text-transform: uppercase;
    color: #666;
  }
  .drop {
    color: #f47171;
  }
  .columns {
    color: #666;
    font-size: 0.9rem;
  }
</style>
