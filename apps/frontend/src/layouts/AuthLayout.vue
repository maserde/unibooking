<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center mb-8">
        <span class="text-2xl font-bold text-primary-600">Unibooking</span>
      </div>
    </div>
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-lg">
        <slot />
      </div>
    </div>
  </div>
</template>
