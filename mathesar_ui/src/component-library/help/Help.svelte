<script lang="ts">
  import { iconHelp } from '@mathesar-component-library-dir/common/icons';
  import Dropdown from '@mathesar-component-library-dir/dropdown/Dropdown.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
</script>

<Dropdown
  ariaLabel="Help"
  placement="auto"
  showArrow={false}
  triggerAppearance="ghost"
  triggerClass="help-trigger"
  contentClass="help-content"
>
  <span slot="trigger" class="help-trigger-content">
    <Icon {...iconHelp} />
  </span>
  <slot slot="content" />
</Dropdown>
