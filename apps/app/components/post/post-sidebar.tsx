'use client';

import { useCallback } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';

import { Button } from '@delulu/design-system/components/ui/button';
import { Calendar } from '@delulu/design-system/components/ui/calendar';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@delulu/design-system/components/ui/card';
import { Checkbox } from '@delulu/design-system/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@delulu/design-system/components/ui/popover';
// import { TimeInput } from '@delulu/design-system/components/ui/time-input';
import type { SocialProviderType } from '@delulu/validators/post';

import { useStore } from '@/store/post';
// import { SocialIcon } from '../common/social-icon';

export function PostSidebar() {
  const { date, time, setDate, setTime, post, setPost, socialProviders } =
    useStore((state) => ({
      date: state.date,
      time: state.time,
      setDate: state.setDate,
      setTime: state.setTime,
      post: state.post,
      setPost: state.setPost,
      socialProviders: state.socialProviders,
    }));

  const handleSchedule = useCallback(() => {
    // TODO: Implement scheduling logic
  }, []);

  const handlePostNow = useCallback(() => {
    // TODO: Implement post now logic
  }, []);

  const handleProviderToggle = useCallback(
    (provider: SocialProviderType) => {
      const isSelected = post.alternativeContent.some(
        (content) => content.socialProvider.socialId === provider.socialId
      );

      if (isSelected) {
        // Remove provider
        setPost({
          ...post,
          alternativeContent: post.alternativeContent.filter(
            (content) => content.socialProvider.socialId !== provider.socialId
          ),
        });
      } else {
        // Add provider with default content
        setPost({
          ...post,
          alternativeContent: [
            ...post.alternativeContent,
            {
              socialProvider: provider,
              content: [
                {
                  id: '',
                  order: 0,
                  name: provider.name,
                  media: [],
                  text: post.content[0]?.text || '',
                  tags: [],
                  socialId: provider.socialId,
                },
              ],
            },
          ],
        });
      }
    },
    [post, setPost]
  );

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Post Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div
              id="social-providers-label"
              className="mb-2 block font-medium text-sm"
            >
              Social Networks
            </div>
            <div className="space-y-2">
              {socialProviders.map((provider) => {
                const isSelected = post.alternativeContent.some(
                  (content) =>
                    content.socialProvider.socialId === provider.socialId
                );

                return (
                  <div
                    key={provider.socialId}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={provider.socialId}
                      checked={isSelected}
                      onCheckedChange={() => handleProviderToggle(provider)}
                    />
                    <label
                      htmlFor={provider.socialId}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      {/* <SocialIcon type={provider.socialType} size="sm" /> */}
                      <span>{provider.name}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div id="schedule-label" className="mb-2 block font-medium text-sm">
              Schedule Post
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={date ? 'w-[280px]' : 'w-[280px] justify-start'}
                    aria-labelledby="schedule-label"
                  >
                    <IoCalendarOutline className="mr-2 h-4 w-4" />
                    {date ? date.toLocaleDateString() : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {date && (
            <div>
              <div id="time-label" className="mb-2 block font-medium text-sm">
                Time
              </div>
              {/* <TimeInput
                value={time || ''}
                onChange={setTime}
                aria-labelledby="time-label"
              /> */}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={handlePostNow}
          disabled={!date && !time}
        >
          Post Now
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleSchedule}
          disabled={!date || !time}
        >
          Schedule Post
        </Button>
      </CardFooter>
    </Card>
  );
}
