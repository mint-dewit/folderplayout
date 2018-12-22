<template>
    <b-row>
        <b-col>
            <h1 class="text-center">{{ $store.state.playoutState.curTime }}</h1>
        </b-col>
        <b-col>
            <h1 class="text-center">{{ $store.state.playoutState.countdown }}</h1>
        </b-col>
    </b-row>
</template>
