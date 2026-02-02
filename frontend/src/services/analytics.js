import { sendGAEvent } from '@next/third-parties/google'

export const analytics = {
    // Standard event for content clicks
    trackContentClick: (contentId, contentTitle, categoryId) => {
        sendGAEvent('event', 'content_click', {
            content_id: contentId,
            content_title: contentTitle,
            category_id: categoryId,
        })
    },

    // Generic event helper
    trackEvent: (eventName, params = {}) => {
        sendGAEvent('event', eventName, params)
    }
}
