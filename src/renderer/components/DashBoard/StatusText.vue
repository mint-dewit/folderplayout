<template>
    <b-row>
        <b-col>
            <h6 class="text-center">NOW PLAYING: {{ $store.state.playoutState.nowPlaying }}</h6>
        </b-col>
        <b-col>
            <h6 class="text-center">NEXT UP: {{ $store.state.playoutState.nextUp }}</h6>
        </b-col>
    </b-row>
</template>
