<script setup>
    const props = defineProps({
        parameters: {
            type: Object,
            default: null
        },
        visible: Boolean,
    })

    const formatText = (text) => {
        if (text === null || text === undefined) {
            return '';
        }

        return text.replace(/\n/g, '<br>');
    };
</script>
<template>
    <div v-if="visible" class="mr-auto rounded-lg rounded-tl-none my-[0.1em] p-1 text-sm bg-white flex flex-col relative speech-bubble-left max-w-[25em]">
        <div v-if="parameters.header.format != null && parameters.header.format != 'TEXT'" class="mb-4 flex justify-center rounded">
            <div v-if="parameters.header.format === 'IMAGE'" class="_7r39 _8h0h" :style="'background-image: url(&quot;' + parameters.header.parameters[0].value + '&quot;);'"></div>
            <img v-if="parameters.header.format === 'VIDEO'" :src="'/images/video-placeholder.png'">
            <img v-if="parameters.header.format === 'DOCUMENT'" :src="'/images/document-placeholder.png'">
        </div>
        <h2 v-else class="text-gray-700 text-[16px] mb-1 px-2">{{ parameters.header.text }}</h2>
        <p class="px-2" v-html="formatText(parameters.body.text)"></p>
        <div class="text-[#8c8c8c] mt-1 px-2">
            <span class="text-[13px]">{{ parameters.footer.text }}</span>
            <span class="text-right text-xs leading-none float-right" :class="parameters.footer.text ? 'mt-2' : ''">9:15</span>
        </div>
    </div>
    <div v-if="parameters.buttons.length > 0" class="mr-auto text-sm text-[#00a5f4] flex flex-col relative max-w-[25em]">
        <div v-for="(item, index) in parameters.buttons" :key="index" class="flex justify-center items-center space-x-2 rounded-lg bg-white h-10 my-[0.1em]">
            <span>
                <svg v-if="item.type === 'COPY_CODE'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"/></svg>
                <svg v-else-if="item.type === 'PHONE_NUMBER'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none"><path fill="currentColor" d="M20 16v4c-2.758 0-5.07-.495-7-1.325c-3.841-1.652-6.176-4.63-7.5-7.675C4.4 8.472 4 5.898 4 4h4l1 4l-3.5 3c1.324 3.045 3.659 6.023 7.5 7.675L16 15l4 1z"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 18.675c1.93.83 4.242 1.325 7 1.325v-4l-4-1l-3 3.675zm0 0C9.159 17.023 6.824 14.045 5.5 11m0 0C4.4 8.472 4 5.898 4 4h4l1 4l-3.5 3z"/></g></svg>
                <img v-else-if="item.type === 'URL'" :src="'/images/icons/link.png'" class="h-4">
                <img v-else :src="'/images/icons/reply.png'" class="h-4">
            </span>
            <span>{{ item.text }}</span>
        </div>
    </div>
</template>