using System;
using Foundation;
using UIKit;
//using CoreGraphics;
using AVFoundation;
using WikitudeComponent.iOS;
using Adeon.iOS.CoreServices;



namespace Adeon.iOS
{
    public partial class ViewController : UIViewController
    {
        /*protected class ArchitectDelegate : WTArchitectViewDelegate
        {
            [Weak]
            protected ViewController arExperienceViewController;

            public ArchitectDelegate(ViewController arExperienceViewController)
            {
                this.arExperienceViewController = arExperienceViewController;
            }

            public override void DidFinishLoadNavigation(WTArchitectView architectView, WTNavigation navigation)
            {
                Console.WriteLine("Finished loading Architect World");
                arExperienceViewController.ArchitectWorldFinishedLoading(navigation);
            }

            public override void DidFailToLoadNavigation(WTArchitectView architectView, WTNavigation navigation, NSError error)
            {
                string errorMessage = error.LocalizedDescription + " ('" + navigation.OriginalURL + "')";
                UIAlertController failedToLoadArchitectWorldAlertController = UIAlertController.Create("Failed to load Architect World", errorMessage, UIAlertControllerStyle.Alert);
                failedToLoadArchitectWorldAlertController.AddAction(UIAlertAction.Create("OK", UIAlertActionStyle.Default, null));

                arExperienceViewController.PresentViewController(failedToLoadArchitectWorldAlertController, true, null);
            }

            public override UIViewController PresentingViewControllerForViewControllerPresentationInArchitectView(WTArchitectView architectView)
            {
                return arExperienceViewController;
            }
        }*/

        /*
        protected class NavigationControllerDelegate : UINavigationControllerDelegate
        {
            [Weak]
            protected WTArchitectView architectView;

            public NavigationControllerDelegate(WTArchitectView architectView)
            {
                this.architectView = architectView;
            }

        }*/

        protected WTArchitectView architectView;
        //protected ArchitectDelegate delegateObject;

        [Weak]
        protected WTNavigation loadedArExperienceNavigation;
        protected WTNavigation loadingArExperienceNavigation;

        protected NSObject applicationWillResignActiveObserver;
        protected NSObject applicationDidBecomeActiveObserver;

        private WTAuthorizationRequestManager authorizationRequestManager = new WTAuthorizationRequestManager();

        protected bool isRunning;

        public override void ViewDidLoad()
        {
            base.ViewDidLoad();

            architectView = new WTArchitectView();
            architectView.SetLicenseKey("rXxGPSn4WA2Bkg6vd1j176qXR6Y9iKULHtta8L2EFDvj8NZymFAkUWOlC8fgj6oUE59u7DLgXTAqU1we2tmkQ2drwhcaxx/FxxJacaM0462FMqDElT7a6klWFLSaf/7B20kiUmiHcriRWTS4lX3l+xN6+X/rwV+DIL+OXZsEf9hTYWx0ZWRfX0/WkNROVvDYiF7eGx0lP/XutcXlZX2otUyKY1s/Q1AxtFtrHRvEeUw11Ti+2O/qij12LF/cOdPMEL2/bKe0bbFHCVJR/lpQEvxG7o25We3l58t1ZPsDzOziNvxD4g8e5HHCILFwFXzesbOMLhc+LrdulPh6sUsrmGiJOmln7dPyHMgxWRa8rYuUR19hRihOftJ1593Pkz1j324PDUoNKYWeHt2gYzc4z3Prdy/oCO3g5hBdrFLnsRdWzfdjyVNR34b+iaCcnUckSMCQ2k7RohreNh5JEDK5DMHCD7dbUc//SS7qFbjmd8V/rworMeA4X/VuZPaJrufYUzXHZJV2xp3zjrF0qj/dO+E2mBA1kJwnZ0LE4XmDwAElabT0U3K4E2lM4UR+I3r3SNj3/6K4SVKs+wtbk5ie8TkYbfXhkWQKeug8Bn1lOsPVKGUuAxRtCni4L2HQpQ2vtbDZgdVaEAMRjPRoEmx0txT3W1FNJhkJCTUL05jM/sEn3VcCEzUxKA+snBjk9ys+D497kw/FL/qW81bHWPi6gNev8LNLxzgdvrcoCBepMko5HrGq0UyJNOg8Xz+Zyl0VtC2X/qIu+iVfd54/E2vr5A==");
            //delegateObject = new ArchitectDelegate(this);
            //architectView.Delegate = delegateObject;
            architectView.TranslatesAutoresizingMaskIntoConstraints = false;
            Add(architectView);

            architectView.CenterXAnchor.ConstraintEqualTo(View.CenterXAnchor).Active = true;
            architectView.CenterYAnchor.ConstraintEqualTo(View.CenterYAnchor).Active = true;
            architectView.WidthAnchor.ConstraintEqualTo(View.WidthAnchor).Active = true;
            architectView.HeightAnchor.ConstraintEqualTo(View.HeightAnchor).Active = true;

            EdgesForExtendedLayout = UIRectEdge.None;
        }

        public override void ViewWillAppear(bool animated)
        {
            base.ViewWillAppear(animated);

            LoadArExperience();
            StartArchitectViewRendering();

            applicationWillResignActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.WillResignActiveNotification, ApplicationWillResignActive);
            applicationDidBecomeActiveObserver = NSNotificationCenter.DefaultCenter.AddObserver(UIApplication.DidBecomeActiveNotification, ApplicationDidBecomeActive);
        }


        public override void ViewDidDisappear(bool animated)
        {
            base.ViewDidDisappear(animated);

            StopArchitectViewRendering();

            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationWillResignActiveObserver);
            NSNotificationCenter.DefaultCenter.RemoveObserver(applicationDidBecomeActiveObserver);
        }

        public override void DidReceiveMemoryWarning()
        {
            base.DidReceiveMemoryWarning();
            // Release any cached data, images, etc that aren't in use.
        }

        /* FORSE POSSO CANCELLARLO 
        public override void ViewWillTransitionToSize(CGSize toSize, IUIViewControllerTransitionCoordinator coordinator)
        {
            if (coordinator != null)
            {
                coordinator.AnimateAlongsideTransition((IUIViewControllerTransitionCoordinatorContext context) =>
                {
                    UIInterfaceOrientation newInterfaceOrientation = UIApplication.SharedApplication.StatusBarOrientation;
                    architectView.SetShouldRotateToInterfaceOrientation(true, newInterfaceOrientation);
                }, null);
            }
            else
            {
                UIInterfaceOrientation newInterfaceOrientation = UIApplication.SharedApplication.StatusBarOrientation;
                architectView.SetShouldRotateToInterfaceOrientation(true, newInterfaceOrientation);
            }

            base.ViewWillTransitionToSize(toSize, coordinator);
        }*/

        public void ArchitectWorldFinishedLoading(WTNavigation navigation)
        {
            if (loadingArExperienceNavigation.Equals(navigation))
            {
                loadedArExperienceNavigation = navigation;
            }
        }

        #region Notifications
        private void ApplicationWillResignActive(NSNotification notification)
        {
            StopArchitectViewRendering();
        }

        private void ApplicationDidBecomeActive(NSNotification notification)
        {
            StartArchitectViewRendering();
        }
        #endregion

        #region Private Methods
        private void LoadArExperience()
        {
            WTFeatures requiredFeatures = WTFeatures.Geo;

            ArExperienceAuthorizationController.AuthorizeRestricedAPIAccess(authorizationRequestManager, requiredFeatures, () => {
                NSUrl fullArExperienceURL = NSBundle.MainBundle.GetUrlForResource("index", "html", "Milan");
                loadingArExperienceNavigation = architectView.LoadArchitectWorldFromURL(fullArExperienceURL);
            }, (UIAlertController alertController) => {
                PresentViewController(alertController, true, null);
            });
        }

        private void StartArchitectViewRendering()
        {
            if (!architectView.IsRunning)
            {
                architectView.Start((WTArchitectStartupConfiguration architectStartupConfiguration) =>
                {
                    architectStartupConfiguration.CaptureDevicePosition = AVCaptureDevicePosition.Back;
                    architectStartupConfiguration.CaptureDeviceResolution = WTCaptureDeviceResolution.WTCaptureDeviceResolution_AUTO;
                    architectStartupConfiguration.CaptureDeviceFocusMode = AVCaptureFocusMode.ContinuousAutoFocus;
                }, (bool success, NSError error) =>
                {
                    isRunning = success;
                });
            }
        }

        private void StopArchitectViewRendering()
        {
            if (isRunning)
            {
                architectView.Stop();
            }
        }
        #endregion

        public ViewController(IntPtr handle) : base(handle)
        {

        }
    }
}